import mongoose from "mongoose";
import Purchase from "../models/Purchase.js";
import Transaction from "../models/Transaction.js"; 
import Supplier from "../models/Supplier.js";      
import ActivityLog from "../models/activityLog.js"; // ✅ Audit Trail ke liye model joda

/* =============================================
    📜 Helper: Audit Logger
============================================= */
const logAudit = async (adminName, action, module = "PURCHASE") => {
  try {
    await ActivityLog.create({
      adminName: adminName || "System",
      action: action,
      module: module,
      createdAt: new Date()
    });
  } catch (err) {
    console.error("Audit Logging Failed:", err);
  }
};


/* =============================================
    ➕ ADD PURCHASE (Fixed NaN Error)
============================================= */
export const addPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payload = req.body;
    const toNum = (val) => {
      const n = Number(val);
      return isNaN(n) ? 0 : n; // Double safety
    };

    const totalAmount = toNum(payload.totalAmount);
    const paidAmount = toNum(payload.paidAmount);
    const netBalanceChange = totalAmount - paidAmount;

    // 1. Purchase record create
    const [purchase] = await Purchase.create([{
      ...payload,
      quantity: toNum(payload.quantity),
      rate: toNum(payload.rate),
      totalAmount: totalAmount,
      paidAmount: paidAmount,
    }], { session });

    // 2. Supplier Update ($inc is atomic)
    const partySearchName = payload.supplierName?.trim();
    const partySearchMobile = payload.mobile?.toString().trim();

    const updatedSupplier = await Supplier.findOneAndUpdate(
      { 
        $or: [
          { name: { $regex: `^${partySearchName}$`, $options: "i" } }, 
          { mobile: partySearchMobile }
        ] 
      },
      { $inc: { currentBalance: netBalanceChange, totalOwed: netBalanceChange } },
      { session, new: true } 
    );

    if (!updatedSupplier) {
      throw new Error(`Supplier '${payload.supplierName}' nahi mila.`);
    }

    // 3. Transactions create (Fixing NaN here)
    const finalBalance = toNum(updatedSupplier.currentBalance);
    const transactions = [];

    // A. Purchase Record (OUT)
    // Balance logic: Final balance mein se payment wala effect hata kar 'Purchase' ke waqt ka balance nikalna
    const balanceAtPurchaseStep = finalBalance + paidAmount; 

    transactions.push({
      partyId: updatedSupplier._id,
      purchaseId: purchase._id,
      type: 'OUT',
      amount: totalAmount,
      description: `Purchase: Bill No ${payload.billNo || 'N/A'}`,
      remainingBalance: toNum(balanceAtPurchaseStep), // Strict Check
      paymentMethod: "Credit",
      date: payload.date || new Date()
    });

    // B. Payment Record (IN)
    if (paidAmount > 0) {
      transactions.push({
        partyId: updatedSupplier._id,
        purchaseId: purchase._id,
        type: 'IN',
        amount: paidAmount,
        description: `Paid for Bill No ${payload.billNo || 'N/A'}`,
        remainingBalance: toNum(finalBalance), // Strict Check
        paymentMethod: payload.paymentMethod || "Cash/Bank",
        date: payload.date || new Date()
      });
    }

    await Transaction.insertMany(transactions, { session });

    // 4. Audit log
    await logAudit(
      payload.adminName || "System",
      `New Purchase: Bill No ${payload.billNo} (₹${totalAmount})`,
      { session }
    );

    await session.commitTransaction();
    res.status(201).json({ success: true, message: "Success ✅", data: purchase });

  } catch (error) {
    await session.abortTransaction();
    console.error("❌ ADD PURCHASE ERROR:", error.message);
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};
/* =========================
    📄 GET ALL PURCHASES
========================= */
export const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: purchases.length,
      data: purchases
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* =============================================
    🛠 UPDATE PURCHASE (Safe, Session Optional)
============================================= */
export const updatePurchase = async (req, res) => {
  let session;
  const useTransaction = mongoose.connection.readyState && mongoose.connection.client.s && mongoose.connection.client.topology?.description?.type === "ReplicaSetWithPrimary";

  try {
    if (useTransaction) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    const { id } = req.params;
    const { _id, createdAt, updatedAt, ...updateData } = req.body;


    // 🔎 Find old purchase (string safe)
    const oldPurchase = await Purchase.findOne({
      $expr: { $eq: [{ $toString: "$_id" }, id] }
    }).session(session);

    if (!oldPurchase) throw new Error("Purchase record not found");

    // 🔎 Find supplier safely
    const supplier = await Supplier.findOne({
      $or: [
        { name: oldPurchase.supplierName?.trim() },
        { mobile: oldPurchase.mobile?.trim() }
      ]
    }).session(session);

    if (!supplier) throw new Error("Supplier not found");

    const oldTotal = Number(oldPurchase.totalAmount || 0);
    const oldPaid = Number(oldPurchase.paidAmount || 0);

    // 1️⃣ Reverse old balance
    const updatedSupplier1 = await Supplier.findByIdAndUpdate(
      supplier._id,
      { $inc: { currentBalance: -oldTotal + oldPaid } },
      { new: true, session }
    );



    // 2️⃣ Update purchase
    const updatedPurchase = await Purchase.findOneAndUpdate(
      { $expr: { $eq: [{ $toString: "$_id" }, id] } },
      updateData,
      { new: true, runValidators: true, session }
    );

    if (!updatedPurchase) throw new Error("Purchase update failed");



    const newTotal = Number(updatedPurchase.totalAmount || 0);
    const newPaid = Number(updatedPurchase.paidAmount || 0);

    // 3️⃣ Apply new balance
    const updatedSupplier2 = await Supplier.findByIdAndUpdate(
      supplier._id,
      { $inc: { currentBalance: newTotal - newPaid } },
      { new: true, session }
    );


    // 4️⃣ Create ledger entry safely
    await Transaction.create([{
      partyId: supplier._id,
      purchaseId: updatedPurchase._id,
      type: "OUT",
      amount: 0,
      description: `Purchase Updated: Bill No ${updatedPurchase.billNo}`,
      remainingBalance: updatedSupplier2?.currentBalance || 0,
      date: new Date()
    }], { session });



    // 5️⃣ Audit
    await logAudit(
      updateData.adminName,
      `Purchase Record Updated: Bill No ${updatedPurchase.billNo} (${updatedPurchase.supplierName})`
    );

    if (session) await session.commitTransaction();

    res.json({
      success: true,
      message: "Purchase updated and balance adjusted ✅",
      data: updatedPurchase
    });

  } catch (error) {
    if (session) await session.abortTransaction();
    console.log("❌ UPDATE PURCHASE ERROR:", error.message);
    res.status(400).json({
      success: false,
      message: error.message
    });
  } finally {
    if (session) session.endSession();
  }
};
/* =========================
    ❌ DELETE PURCHASE (Reverse Ledger Logic)
========================= */
export const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const adminName = req.query.adminName || "Unknown Admin";


    // 🔎 Find purchase (string-safe)
    const purchase = await Purchase.findOne({
      $expr: { $eq: [{ $toString: "$_id" }, id] }
    });
 

    if (!purchase) throw new Error("Purchase record not found");

    // 🔎 Find supplier safely
    const supplier = await Supplier.findOne({
      $or: [
        { name: purchase.supplierName?.trim() },
        { mobile: (purchase.phone || purchase.mobile)?.trim() }
      ]
    });
    // 🔹 Reverse balance if supplier exists
    if (supplier) {
      const updatedSupplier = await Supplier.findByIdAndUpdate(
        supplier._id,
        {
          $inc: {
            currentBalance: -Number(purchase.totalAmount || 0) + Number(purchase.paidAmount || 0)
          }
        },
        { new: true }
      );
     
    } else {
      console.log("No supplier found, skipping balance reverse");
    }

    // 🔹 Delete related transactions (purchaseId matching string-safe)
    // const txDeleteResult = await Transaction.deleteMany({
    //   $expr: { $eq: [{ $toString: "$purchaseId" }, id] }
    // });
  

    // 🔹 Delete purchase (string-safe)
    const purchaseDeleteResult = await Purchase.deleteOne({
      $expr: { $eq: [{ $toString: "$_id" }, id] }
    });
  

    if (purchaseDeleteResult.deletedCount === 0) {
      throw new Error("Purchase delete failed");
    }

    // 🔹 Audit log
    await logAudit(
      adminName,
      `⚠️ CRITICAL: Purchase Record Deleted! Bill No ${purchase.billNo} from ${purchase.supplierName}`
    );

    res.json({
      success: true,
      message: "Purchase deleted & Ledger reversed ✅"
    });

  } catch (error) {
    console.log("❌ DELETE PURCHASE ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};