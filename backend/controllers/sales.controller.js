import mongoose from "mongoose";
import Sale from "../models/Sale.js";
import Transaction from "../models/Transaction.js";
import Supplier from "../models/Supplier.js";
import Stock from "../models/Stock.js"; // New: Added for Stock tracking
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
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("Audit Logging Failed:", err);
  }
};

/* =========================================
    🔎 Escape Regex
========================================= */
const escapeRegex = (text) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/* =========================================
    🔎 Helper: Safe ID Query
========================================= */
const findByIdSafe = async (Model, id) => {
  return Model.findOne({
    $expr: { $eq: [{ $toString: "$_id" }, String(id)] },
  });
};

/* =========================================
    🔎 Helper: Party Finder (safe)
========================================= */
const findPartyByName = async (name, session = null) => {
  const partyName = (name || "").trim();
  const safeName = escapeRegex(partyName);
  const query = {
    name: { $regex: `^${safeName}$`, $options: "i" },
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
    const lastSale = await Sale.findOne().sort({ createdAt: -1 });
    let nextBillNo = 1;
    if (lastSale && lastSale.billNo) {
      const lastNo = parseInt(lastSale.billNo.replace(/[^0-9]/g, ""));
      nextBillNo = isNaN(lastNo) ? 1 : lastNo + 1;
    }
    res.json({ success: true, nextBillNo: nextBillNo.toString() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================
    1️⃣ CREATE: Add Sale (With Transaction & Stock)
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
      freight: toSafeNumber(payload.travelingCost || payload.freight),
      date: payload.date || new Date().toISOString().split('T')[0],
      totalAmount,
      amountReceived: paidAmount,
      paymentDue: totalAmount - paidAmount
    };

    const [sale] = await Sale.create([sanitizedData], { session });
    const partyName = payload.consigneeName || payload.customerName;
    const party = await findPartyByName(partyName, session);

    if (!party) {
      throw new Error(`Customer/Supplier '${partyName}' database mein nahi mila!`);
    }

    // Balance calculation
    const initialBalance = toSafeNumber(party.currentBalance || party.totalOwed);
    const newBalanceAfterSale = initialBalance + totalAmount;
    const finalBalance = newBalanceAfterSale - paidAmount;

    // Transaction entries
    const transactions = [{
      partyId: party._id,
      partyModel: 'Supplier',
      partyName: party.name,
      saleId: sale._id,
      type: "OUT",
      amount: totalAmount,
      description: `Sale: Bill No ${payload.billNo || "N/A"}`,
      remainingBalance: newBalanceAfterSale,
      paymentMethod: "Credit",
      date: sanitizedData.date,
      refNo: payload.billNo
    }];

    if (paidAmount > 0) {
      transactions.push({
        partyId: party._id,
        partyModel: 'Supplier',
        partyName: party.name,
        saleId: sale._id,
        type: "IN",
        amount: paidAmount,
        description: `Payment: Bill No ${payload.billNo || "N/A"}`,
        remainingBalance: finalBalance,
        paymentMethod: payload.paymentMethod || "Cash",
        date: sanitizedData.date,
        refNo: payload.billNo
      });
    }

    await Transaction.insertMany(transactions, { session });

    // Update Party Balance
    await Supplier.updateOne(
      { _id: party._id },
      { $set: { totalOwed: finalBalance, currentBalance: finalBalance } },
      { session }
    );

    // Sync Stock
    if (payload.goods && Array.isArray(payload.goods)) {
      for (const item of payload.goods) {
        await Stock.updateOne(
          { productName: { $regex: `^${item.product.trim()}$`, $options: "i" } },
          { $inc: { totalOut: toSafeNumber(item.quantity), totalQuantity: -toSafeNumber(item.quantity) } },
          { session }
        );
      }
    }

    await logAudit(payload.adminName, `New Sale Created: Bill No ${payload.billNo}`);
    await session.commitTransaction();

    res.status(201).json({ success: true, message: "Sale Created Successfully ✅", data: sale });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/* =========================================
    2️⃣ UPDATE: updateSale (Fixes Route Error)
========================================= */
export const updateSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { _id, ...updateData } = req.body;

    const oldSale = await findByIdSafe(Sale, id);
    if (!oldSale) throw new Error("Sale record nahi mila");

    // Reverse old balance
    const party = await findPartyByName(oldSale.customerName || oldSale.consigneeName, session);
    if (party) {
      const oldAdjustment = toSafeNumber(oldSale.totalAmount) - toSafeNumber(oldSale.amountReceived);
      await Supplier.updateOne(
        { _id: party._id },
        { $inc: { currentBalance: -oldAdjustment, totalOwed: -oldAdjustment } },
        { session }
      );
    }

    const updatedSale = await Sale.findByIdAndUpdate(id, updateData, { new: true, session });
    
    // Re-apply new balance
    if (party) {
      const newAdjustment = toSafeNumber(updatedSale.totalAmount) - toSafeNumber(updatedSale.amountReceived);
      await Supplier.updateOne(
        { _id: party._id },
        { $inc: { currentBalance: newAdjustment, totalOwed: newAdjustment } },
        { session }
      );
    }

    await logAudit(req.body.adminName, `Sale Updated: Bill No ${updatedSale.billNo}`);
    await session.commitTransaction();
    res.json({ success: true, message: "Sale & Balance updated ✅", data: updatedSale });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/* =========================================
    3️⃣ DELETE: Delete Sale
========================================= */
export const deleteSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const adminName = req.query.adminName;

    const sale = await findByIdSafe(Sale, id);
    if (!sale) throw new Error("Sale record nahi mila");

    const party = await findPartyByName(sale.customerName || sale.consigneeName, session);
    if (party) {
      const adjustment = toSafeNumber(sale.totalAmount) - toSafeNumber(sale.amountReceived);
      await Supplier.updateOne(
        { _id: party._id },
        { $inc: { currentBalance: -adjustment, totalOwed: -adjustment } },
        { session }
      );
    }

    // Rollback Stock
    if (sale.goods && Array.isArray(sale.goods)) {
      for (const item of sale.goods) {
        await Stock.updateOne(
          { productName: { $regex: `^${item.product.trim()}$`, $options: "i" } },
          { $inc: { totalOut: -toSafeNumber(item.quantity), totalQuantity: toSafeNumber(item.quantity) } },
          { session }
        );
      }
    }

    await Transaction.deleteMany({ refNo: sale.billNo }).session(session);
    await Sale.deleteOne({ _id: id }).session(session);

    await logAudit(adminName, `⚠️ CRITICAL: Sale Deleted! Bill No ${sale.billNo}`);
    await session.commitTransaction();
    res.json({ success: true, message: "Sale deleted and data adjusted ✅" });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/* =========================================
    4️⃣ READ: Get All Sales
========================================= */
export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    res.json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================
    5️⃣ DATA CLEANUP (Fixes Route Error)
========================================= */
export const migrateSalesData = async (req, res) => {
  try {
    const result = await Sale.updateMany(
      { $or: [{ totalAmount: { $exists: false } }, { totalAmount: 0 }] },
      [{ $set: { totalAmount: "$totalPrice" } }]
    );
    res.json({ success: true, message: `${result.modifiedCount} records fixed ✅` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};