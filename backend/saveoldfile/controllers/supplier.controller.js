import Supplier from "../models/Supplier.js";
import Transaction from "../models/Transaction.js";
import ActivityLog from "../models/ActivityLog.js"; // ✅ Fixed Case (Capital A/L)
import mongoose from "mongoose";

/* =============================================
    📜 Helper: Audit Logger (Overwrite Safe)
============================================= */
const logAudit = async (adminName, action, module = "SUPPLIER") => {
  try {
    // Overwrite error se bachne ke liye safe model check
    const Audit = mongoose.models.ActivityLog || ActivityLog;
    await Audit.create({
      adminName: adminName || "System",
      action,
      module,
      createdAt: new Date()
    });
  } catch (err) {
    console.error("Audit Logging Failed:", err);
  }
};

/* =============================================
    🔹 Helper: Transaction Support
============================================= */
const canUseTransaction = () => {
  return mongoose.connection.client?.topology?.description?.type === "ReplicaSetWithPrimary";
};

/* =============================================
    🔹 Helper: Safe ID Query
============================================= */
const findSupplierByIdSafe = async (id, session = null) => {
  const query = { $expr: { $eq: [{ $toString: "$_id" }, String(id)] } };
  return session ? Supplier.findOne(query).session(session) : Supplier.findOne(query);
};

/* =============================================
    1️⃣ Create Supplier (Opening Bal Entry)
============================================= */
export const createSupplier = async (req, res) => {
  let session;
  try {
    if (canUseTransaction()) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    const { name, gstin, phone, address, previousBalance, adminName } = req.body;
    const openingBal = Number(previousBalance || 0);

    if (gstin) {
      const existing = await Supplier.findOne({ gstin }).session(session);
      if (existing) throw new Error("GSTIN pehle se register hai!");
    }

    const [supplier] = await Supplier.create([{
      name, gstin, phone, address,
      previousBalance: openingBal,
      totalOwed: openingBal,
      currentBalance: openingBal,
      currentBillsTotal: 0
    }], { session });

    // Ledger mein Opening Balance ki entry
    if (openingBal !== 0) {
      await Transaction.create([{
        partyId: supplier._id,
        partyModel: 'Supplier',
        partyName: supplier.name,
        type: "OUT",
        amount: openingBal,
        description: "Opening Balance (Account Setup)",
        remainingBalance: openingBal,
        date: new Date().toISOString().split('T')[0]
      }], { session });
    }

    await logAudit(adminName, `Registered: ${name} (Opening Bal: ₹${openingBal})`);

    if (session) await session.commitTransaction();
    res.status(201).json({ success: true, data: supplier });

  } catch (error) {
    if (session) await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    if (session) session.endSession();
  }
};

/* =============================================
    2️⃣ Get All Suppliers
============================================= */
export const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 }); // Sort by Name
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: "Suppliers fetch failed" });
  }
};

/* =============================================
    3️⃣ Update Supplier (Balance Adjustment Logic)
============================================= */
export const updateSupplier = async (req, res) => {
  let session;
  try {
    if (canUseTransaction()) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    const { id } = req.params;
    const { name, address, phone, gstin, previousBalance, adminName } = req.body;

    const oldSupplier = await findSupplierByIdSafe(id, session);
    if (!oldSupplier) throw new Error("Supplier nahi mila");

    const oldPrevBal = Number(oldSupplier.previousBalance || 0);
    const newPrevBal = Number(previousBalance || 0);
    const diff = newPrevBal - oldPrevBal;

    const supplier = await Supplier.findByIdAndUpdate(
      oldSupplier._id,
      { 
        name, address, phone, gstin, 
        previousBalance: newPrevBal,
        $inc: { totalOwed: diff, currentBalance: diff } 
      },
      { new: true, session }
    );

    if (diff !== 0) {
      await Transaction.create([{
        partyId: supplier._id,
        partyModel: 'Supplier',
        partyName: supplier.name,
        type: diff > 0 ? "OUT" : "IN",
        amount: Math.abs(diff),
        description: `Manual Adjustment: Opening Balance changed from ${oldPrevBal} to ${newPrevBal}`,
        remainingBalance: supplier.currentBalance,
        date: new Date().toISOString().split('T')[0]
      }], { session });
    }

    await logAudit(adminName, `Updated: ${name} (Bal Adjusted: ₹${diff})`);
    if (session) await session.commitTransaction();
    res.status(200).json({ success: true, data: supplier });

  } catch (error) {
    if (session) await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    if (session) session.endSession();
  }
};

/* =============================================
    4️⃣ Delete Supplier (Critical Cleanup)
============================================= */
export const deleteSupplier = async (req, res) => {
  let session;
  try {
    if (canUseTransaction()) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    const { id } = req.params;
    const adminName = req.query.adminName;

    const supplier = await findSupplierByIdSafe(id, session);
    if (!supplier) throw new Error("Supplier record missing");

    await Supplier.deleteOne({ _id: supplier._id }).session(session);
    // Delete all linked history to keep database clean
    await Transaction.deleteMany({ partyId: supplier._id }).session(session);

    await logAudit(adminName, `⚠️ CRITICAL: Supplier ${supplier.name} deleted!`, "SUPPLIER");

    if (session) await session.commitTransaction();
    res.status(200).json({ success: true, message: "Supplier & Ledger Deleted ✅" });

  } catch (error) {
    if (session) await session.abortTransaction();
    res.status(500).json({ success: false, message: "Delete operation failed" });
  } finally {
    if (session) session.endSession();
  }
};