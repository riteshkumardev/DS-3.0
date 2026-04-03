import mongoose from "mongoose";
import Sale from "../models/Sale.js";
import Transaction from "../models/Transaction.js";
import Supplier from "../models/Supplier.js";
import ActivityLog from "../models/activityLog.js";

/* =========================================
   🔒 Helper: Number Conversion
========================================= */
const toSafeNumber = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

/* =========================================
   📜 Helper: Audit Logger
========================================= */
const logAudit = async (adminName, action, module = "SALES") => {
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

/* =========================================
   🔎 Escape Regex (important fix)
========================================= */
const escapeRegex = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/* =========================================
   🔎 Helper: Safe ID Query
========================================= */
const findByIdSafe = async (Model, id) => {
  return Model.findOne({
    $expr: { $eq: [{ $toString: "$_id" }, String(id)] }
  });
};

/* =========================================
   🔎 Helper: Party Finder (safe)
========================================= */
const findPartyByName = async (name, session = null) => {

  const partyName = (name || "").trim();
  const safeName = escapeRegex(partyName);

  const query = {
    name: { $regex: `^${safeName}$`, $options: "i" }
  };

  return session
    ? Supplier.findOne(query).session(session)
    : Supplier.findOne(query);
};

/* =========================================
   ✅ READ: Get Latest Bill Number
========================================= */
export const getLatestBillNo = async (req, res) => {
  try {
    const lastSale = await Sale.findOne().sort({ billNo: -1 });
    const nextBillNo =
      lastSale && lastSale.billNo ? Number(lastSale.billNo) + 1 : 1;

    res.json({ success: true, nextBillNo });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

/* =========================================
   1️⃣ CREATE: Add Sale
========================================= */
export const addSale = async (req, res) => {

  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    const payload = req.body;

    const totalAmount = toSafeNumber(payload.totalPrice || payload.totalAmount);
    const paidAmount = toSafeNumber(payload.paidAmount || payload.amountReceived);

    const sanitizedData = {
      ...payload,
      freight: toSafeNumber(payload.travelingCost),
      buyerOrderDate: payload.orderDate || "-",
      dispatchDate: payload.deliveryNoteDate || "-",
      totalAmount
    };

    const [sale] = await Sale.create([sanitizedData], { session });

    const partyName = payload.consigneeName || payload.customerName;

    const party = await findPartyByName(partyName, session);

    if (!party) {
      throw new Error(`Supplier '${partyName}' database mein nahi mila!`);
    }

    const initialBalance = toSafeNumber(
      party.totalOwed || party.currentBalance
    );

    const newBalanceAfterSale = initialBalance + totalAmount;

    const finalBalance = newBalanceAfterSale - paidAmount;

    const transactions = [];

    transactions.push({
      partyId: party._id,
      saleId: sale._id,
      type: "OUT",
      amount: totalAmount,
      description: `Sale: Bill No ${payload.billNo || "N/A"}`,
      remainingBalance: newBalanceAfterSale,
      paymentMethod: "Credit",
      date: payload.date || new Date()
    });

    if (paidAmount > 0) {

      transactions.push({
        partyId: party._id,
        saleId: sale._id,
        type: "IN",
        amount: paidAmount,
        description: `Payment: Bill No ${payload.billNo || "N/A"}`,
        remainingBalance: finalBalance,
        paymentMethod: payload.paymentMethod || "Cash",
        date: payload.date || new Date()
      });

    }

    await Transaction.insertMany(transactions, { session });

    await Supplier.updateOne(
      { _id: party._id },
      {
        $set: {
          totalOwed: finalBalance,
          currentBalance: finalBalance
        }
      },
      { session }
    );

    await logAudit(
      payload.adminName,
      `New Sale Created: Bill No ${payload.billNo}`
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Sale Created Successfully ✅",
      data: sale
    });

  } catch (error) {

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("ADD SALE ERROR:", error);

    res.status(400).json({
      success: false,
      message: error.message
    });

  } finally {

    session.endSession();

  }
};

/* =========================================
   2️⃣ UPDATE: updateSale
========================================= */
export const updateSale = async (req, res) => {

  try {

    const { id } = req.params;
    const { _id, ...updateData } = req.body;

    const oldSale = await findByIdSafe(Sale, id);

    if (!oldSale) throw new Error("Sale record nahi mila");

    const oldPartyName = oldSale.consigneeName || oldSale.customerName;

    const oldParty = await findPartyByName(oldPartyName);

    const oldTotal = toSafeNumber(oldSale.totalAmount);
    const oldPaid = toSafeNumber(
      oldSale.paidAmount || oldSale.amountReceived
    );

    if (oldParty) {

      await Supplier.updateOne(
        { _id: oldParty._id },
        {
          $inc: {
            totalOwed: -oldTotal + oldPaid,
            currentBalance: -oldTotal + oldPaid
          }
        }
      );

    }

    const updatedSale = await Sale.findOneAndUpdate(
      { $expr: { $eq: [{ $toString: "$_id" }, String(id)] } },
      updateData,
      { new: true }
    );

    if (!updatedSale) throw new Error("Sale update failed");

    const newPartyName =
      updatedSale.consigneeName || updatedSale.customerName;

    const newParty = await findPartyByName(newPartyName);

    const newTotal = toSafeNumber(updatedSale.totalAmount);
    const newPaid = toSafeNumber(
      updatedSale.paidAmount || updatedSale.amountReceived
    );

    if (newParty) {

      await Supplier.updateOne(
        { _id: newParty._id },
        {
          $inc: {
            totalOwed: newTotal - newPaid,
            currentBalance: newTotal - newPaid
          }
        }
      );

    }

    res.json({
      success: true,
      message: "Sale & Balance updated correctly ✅",
      data: updatedSale
    });

  } catch (error) {

    console.log("UPDATE ERROR:", error.message);

    res.status(400).json({
      success: false,
      message: error.message
    });

  }
};

/* =========================================
   3️⃣ DELETE: Delete Sale
========================================= */
export const deleteSale = async (req, res) => {

  try {

    const { id } = req.params;
    const adminName = req.query.adminName;

    const sale = await findByIdSafe(Sale, id);

    if (!sale) throw new Error("Sale record nahi mila");

    const partyName = sale.consigneeName || sale.customerName;

    const totalAmt = toSafeNumber(sale.totalAmount);
    const paidAmt = toSafeNumber(
      sale.paidAmount || sale.amountReceived
    );

    const party = await findPartyByName(partyName);

    if (party) {

      await Supplier.updateOne(
        { _id: party._id },
        {
          $inc: {
            totalOwed: -totalAmt + paidAmt,
            currentBalance: -totalAmt + paidAmt
          }
        }
      );

    }

    await Transaction.deleteMany({
      $or: [{ saleId: id }, { saleId: sale._id }]
    });

    const saleDelete = await Sale.deleteOne({
      $expr: { $eq: [{ $toString: "$_id" }, String(id)] }
    });

    if (saleDelete.deletedCount === 0) {
      throw new Error("Sale delete failed");
    }

    await logAudit(
      adminName,
      `⚠️ CRITICAL: Sale Deleted! Bill No ${sale.billNo} (${partyName})`
    );

    res.json({
      success: true,
      message: "Sale deleted and Balance adjusted ✅"
    });

  } catch (error) {

    console.log("DELETE ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

/* =========================================
   4️⃣ READ: Get All Sales
========================================= */
export const getSales = async (req, res) => {

  try {

    const sales = await Sale.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: sales.length,
      data: sales
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

/* =========================================
   🧹 5️⃣ DATA CLEANUP
========================================= */
export const migrateSalesData = async (req, res) => {

  try {

    const result = await Sale.updateMany(
      {
        $or: [
          { totalAmount: { $exists: false } },
          { totalAmount: 0 }
        ]
      },
      [
        {
          $set: { totalAmount: "$totalPrice" }
        }
      ]
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} records fixed successfully ✅`
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};