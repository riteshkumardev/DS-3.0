import Supplier from "../models/Supplier.js";
import Transaction from "../models/Transaction.js";
import ActivityLog from "../models/activityLog.js";
import mongoose from "mongoose";

/* =============================================
   📜 Helper: Audit Logger
============================================= */
const logAudit = async (adminName, action, module = "SUPPLIER") => {
  try {
    await ActivityLog.create({
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
   🔹 Helper: Safe ID Query (string + ObjectId)
============================================= */
const findSupplierByIdSafe = async (id, session = null) => {
  const query = {
    $expr: { $eq: [{ $toString: "$_id" }, String(id)] }
  };

  return session
    ? Supplier.findOne(query).session(session)
    : Supplier.findOne(query);
};

/* =============================================
   1️⃣ Create Supplier
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
      if (existing) throw new Error("Supplier with this GSTIN already exists");
    }

    const [supplier] = await Supplier.create([{
      name,
      gstin,
      phone,
      address,
      previousBalance: openingBal,
      totalOwed: openingBal,
      currentBalance: openingBal,
      currentBillsTotal: 0
    }], { session });

    if (openingBal !== 0) {
      await Transaction.create([{
        partyId: supplier._id,
        type: "OUT",
        amount: openingBal,
        description: "Opening Balance (Account Setup)",
        remainingBalance: openingBal,
        date: new Date()
      }], { session });
    }

    await logAudit(adminName, `New Supplier Registered: ${name} (Opening Bal: ₹${openingBal})`);

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

    const suppliers = await Supplier.find().sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: suppliers });

  } catch (error) {

    res.status(500).json({ success: false, message: "Error fetching suppliers" });

  }
};

/* =============================================
   3️⃣ Update Supplier
============================================= */
export const updateSupplier = async (req, res) => {

  let session;

  try {

    if (canUseTransaction()) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    const { id } = req.params;

    const {
      name,
      address,
      phone,
      gstin,
      previousBalance,
      lastBillNo,
      lastBillDate,
      adminName
    } = req.body;

    const oldSupplier = await findSupplierByIdSafe(id, session);

    if (!oldSupplier) throw new Error("Supplier not found");

    const oldPrevBal = Number(oldSupplier.previousBalance || 0);
    const newPrevBal = Number(previousBalance || 0);

    const diff = newPrevBal - oldPrevBal;

    const updatedData = {
      name,
      address,
      phone,
      gstin,
      previousBalance: newPrevBal,
      lastBillNo,
      lastBillDate,
      totalOwed: newPrevBal + (oldSupplier.currentBillsTotal || 0),
      currentBalance: (oldSupplier.currentBalance || 0) + diff
    };

    const supplier = await Supplier.findOneAndUpdate(
      { $expr: { $eq: [{ $toString: "$_id" }, String(id)] } },
      updatedData,
      { new: true, session }
    );

    if (diff !== 0) {

      await Transaction.create([{
        partyId: oldSupplier._id,
        type: diff > 0 ? "OUT" : "IN",
        amount: Math.abs(diff),
        description: "Manual Adjustment: Opening Balance Update",
        remainingBalance: supplier.totalOwed,
        date: new Date()
      }], { session });

    }

    await logAudit(adminName, `Supplier Info Updated: ${name} (Balance Adjusted by ₹${diff})`);

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
   4️⃣ Update Supplier Balance
============================================= */
export const updateSupplierBalance = async (req, res) => {

  let session;

  try {

    if (canUseTransaction()) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    const { supplierId, billAmount, billNo, adminName } = req.body;

    const supplier = await findSupplierByIdSafe(supplierId, session);

    if (!supplier) throw new Error("Supplier not found");

    const amount = Number(billAmount || 0);

    supplier.currentBillsTotal = (supplier.currentBillsTotal || 0) + amount;
    supplier.totalOwed = (supplier.totalOwed || 0) + amount;
    supplier.currentBalance = (supplier.currentBalance || 0) + amount;

    await supplier.save({ session });

    await Transaction.create([{
      partyId: supplier._id,
      type: "OUT",
      amount,
      description: `Purchase: Bill No ${billNo || "N/A"}`,
      remainingBalance: supplier.totalOwed,
      date: new Date()
    }], { session });

    await logAudit(adminName, `Manual Balance Update: Bill No ${billNo} added to ${supplier.name} (Amt: ₹${amount})`);

    if (session) await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Balance & Ledger Updated ✅"
    });

  } catch (error) {

    if (session) await session.abortTransaction();

    res.status(400).json({
      success: false,
      message: error.message
    });

  } finally {

    if (session) session.endSession();

  }
};

/* =============================================
   5️⃣ Delete Supplier
============================================= */
export const deleteSupplier = async (req, res) => {

  let session;

  try {

    if (canUseTransaction()) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    const supplierId = req.params.id;
    const adminName = req.query.adminName || "Unknown Admin";

    const supplier = await findSupplierByIdSafe(supplierId, session);

    if (!supplier) throw new Error("Supplier not found");

    await Supplier.deleteOne({
      $expr: { $eq: [{ $toString: "$_id" }, String(supplierId)] }
    }).session(session);

    await Transaction.deleteMany({
      $expr: { $eq: [{ $toString: "$partyId" }, String(supplierId)] }
    }).session(session);

    await logAudit(
      adminName,
      `⚠️ CRITICAL: Supplier Deleted! ${supplier.name} and all transactions removed`,
      "SUPPLIER"
    );

    if (session) await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Supplier and history removed ✅"
    });

  } catch (error) {

    if (session) await session.abortTransaction();

    console.error("DELETE SUPPLIER ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "Delete failed"
    });

  } finally {

    if (session) session.endSession();

  }
};