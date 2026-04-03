import mongoose from "mongoose";
import Purchase from "../models/Purchase.js";
import Transaction from "../models/Transaction.js"; 
import Supplier from "../models/Supplier.js";      
import Stock from "../models/Stock.js"; // 🆕 Stock sync ke liye
import ActivityLog from "../models/ActivityLog.js"; 

/* =============================================
    📜 Helper: Audit Logger
============================================= */
const logAudit = async (adminName, action, module = "PURCHASE") => {
  try {
    await ActivityLog.create({
      adminName: adminName || "System",
      action: action,
      module: module,
    });
  } catch (err) {
    console.error("Audit Logging Failed:", err);
  }
};

const toNum = (val) => {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
};

/* =============================================
    ➕ ADD PURCHASE (With Stock & Ledger Sync)
============================================= */
export const addPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payload = req.body;
    const totalAmount = toNum(payload.totalAmount);
    const paidAmount = toNum(payload.paidAmount);
    const netBalanceChange = totalAmount - paidAmount;

    // 1. Create Purchase record
    const [purchase] = await Purchase.create([{
      ...payload,
      date: payload.date || new Date().toISOString().split('T')[0],
      totalAmount,
      paidAmount,
      balanceAmount: netBalanceChange
    }], { session });

    // 2. Supplier Update
    const partySearchName = payload.supplierName?.trim();
    const updatedSupplier = await Supplier.findOneAndUpdate(
      { name: { $regex: `^${partySearchName}$`, $options: "i" } },
      { $inc: { currentBalance: netBalanceChange } },
      { session, new: true } 
    );

    if (!updatedSupplier) throw new Error(`Supplier '${payload.supplierName}' nahi mila.`);

    // 3. Transactions create
    const finalBalance = toNum(updatedSupplier.currentBalance);
    const transactions = [{
      partyId: updatedSupplier._id,
      partyModel: 'Supplier',
      partyName: updatedSupplier.name,
      purchaseId: purchase._id,
      type: 'OUT',
      amount: totalAmount,
      description: `Purchase: Bill No ${payload.billNo || 'N/A'}`,
      remainingBalance: finalBalance + paidAmount,
      paymentMethod: "Credit",
      date: purchase.date,
      refNo: payload.billNo
    }];

    if (paidAmount > 0) {
      transactions.push({
        partyId: updatedSupplier._id,
        partyModel: 'Supplier',
        partyName: updatedSupplier.name,
        purchaseId: purchase._id,
        type: 'IN',
        amount: paidAmount,
        description: `Paid for Bill No ${payload.billNo || 'N/A'}`,
        remainingBalance: finalBalance,
        paymentMethod: payload.paymentMethod || "Cash/Bank",
        date: purchase.date,
        refNo: payload.billNo
      });
    }
    await Transaction.insertMany(transactions, { session });

    // 4. 🆕 STOCK UPDATE
    const productName = payload.productName || (payload.goods && payload.goods[0]?.product);
    const qty = toNum(payload.quantity || (payload.goods && payload.goods[0]?.quantity));

    if (productName && qty > 0) {
      await Stock.updateOne(
        { productName: { $regex: `^${productName.trim()}$`, $options: "i" } },
        { $inc: { totalIn: qty, totalQuantity: qty } },
        { session, upsert: true } // Agar item nahi hai toh naya ban jayega
      );
    }

    await logAudit(payload.adminName, `New Purchase: Bill No ${payload.billNo} (₹${totalAmount})`);
    await session.commitTransaction();
    res.status(201).json({ success: true, message: "Purchase & Stock Updated ✅", data: purchase });

  } catch (error) {
    await session.abortTransaction();
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
    res.json({ success: true, data: purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =============================================
    🛠 UPDATE PURCHASE (With Rollback Stock)
============================================= */
export const updatePurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const updateData = req.body;

    const oldPurchase = await Purchase.findById(id).session(session);
    if (!oldPurchase) throw new Error("Purchase record not found");

    const supplier = await Supplier.findOne({ name: oldPurchase.supplierName }).session(session);
    if (!supplier) throw new Error("Supplier not found");

    // 1. Reverse old balance
    const oldAdjustment = toNum(oldPurchase.totalAmount) - toNum(oldPurchase.paidAmount);
    await Supplier.updateOne({ _id: supplier._id }, { $inc: { currentBalance: -oldAdjustment } }, { session });

    // 2. Update Purchase
    const updatedPurchase = await Purchase.findByIdAndUpdate(id, updateData, { new: true, session });

    // 3. Apply new balance
    const newAdjustment = toNum(updatedPurchase.totalAmount) - toNum(updatedPurchase.paidAmount);
    await Supplier.updateOne({ _id: supplier._id }, { $inc: { currentBalance: newAdjustment } }, { session });

    await logAudit(updateData.adminName, `Purchase Updated: Bill No ${updatedPurchase.billNo}`);
    await session.commitTransaction();
    res.json({ success: true, message: "Update Success ✅", data: updatedPurchase });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/* =========================
    ❌ DELETE PURCHASE (Rollback Everything)
========================= */
export const deletePurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const adminName = req.query.adminName;

    const purchase = await Purchase.findById(id).session(session);
    if (!purchase) throw new Error("Purchase record not found");

    // 1. Reverse Balance
    const supplier = await Supplier.findOne({ name: purchase.supplierName }).session(session);
    if (supplier) {
      const adjustment = toNum(purchase.totalAmount) - toNum(purchase.paidAmount);
      await Supplier.updateOne({ _id: supplier._id }, { $inc: { currentBalance: -adjustment } }, { session });
    }

    // 2. Rollback Stock
    const productName = purchase.productName || (purchase.goods && purchase.goods[0]?.product);
    const qty = toNum(purchase.quantity || (purchase.goods && purchase.goods[0]?.quantity));
    if (productName && qty > 0) {
      await Stock.updateOne(
        { productName: { $regex: `^${productName.trim()}$`, $options: "i" } },
        { $inc: { totalIn: -qty, totalQuantity: -qty } },
        { session }
      );
    }

    await Transaction.deleteMany({ refNo: purchase.billNo }).session(session);
    await Purchase.deleteOne({ _id: id }).session(session);

    await logAudit(adminName, `⚠️ DELETE: Purchase Bill No ${purchase.billNo}`);
    await session.commitTransaction();
    res.json({ success: true, message: "Deleted & Stock Adjusted ✅" });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};