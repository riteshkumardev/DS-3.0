import Expense from "../models/Expense.js";
import ActivityLog from "../models/ActivityLog.js"; // Match exact case (Capital A/L)
import mongoose from "mongoose";

/* =============================================
    📜 Helper: Audit Logger (Safe Version)
============================================= */
const logAudit = async (adminName, action, module = "EXPENSE") => {
  try {
    // ActivityLog model safe load check
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

const toSafeNumber = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

/* =============================================
    ➕ ADD EXPENSE
============================================= */
export const addExpense = async (req, res) => {
  try {
    const { partyName, type, amount, adminName, date, category } = req.body;
    
    // Time auto-format (HH:MM AM/PM)
    const time = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const expense = await Expense.create({ 
      ...req.body, 
      amount: toSafeNumber(amount), // Save as Number directly
      date: date || new Date().toISOString().split('T')[0],
      time 
    });

    const actionDesc = `ADDED: ${type} ₹${toSafeNumber(amount).toLocaleString()} - ${partyName} [${category || 'General'}]`;
    await logAudit(adminName, actionDesc);

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* =============================================
    📄 GET EXPENSES (Passbook Report)
============================================= */
export const getExpenses = async (req, res) => {
  try {
    // Recent entries pehle dikhane ke liye sort
    const transactions = await Expense.find().sort({ date: -1, createdAt: -1 });

    // Aggregate calculations for Dashboard
    const stats = await Expense.aggregate([
      {
        $group: {
          _id: null,
          totalIn: {
            $sum: { $cond: [{ $eq: ["$type", "Payment In"] }, "$amount", 0] }
          },
          totalOut: {
            $sum: { $cond: [{ $eq: ["$type", "Payment Out"] }, "$amount", 0] }
          }
        }
      }
    ]);

    const sumIn = stats[0]?.totalIn || 0;
    const sumOut = stats[0]?.totalOut || 0;

    res.status(200).json({
      success: true,
      data: transactions,
      totalIn: sumIn,
      totalOut: sumOut,
      netBalance: sumIn - sumOut 
    });
  } catch (error) {
    console.error("GET EXPENSES ERROR:", error);
    res.status(500).json({ success: false, message: "Server Error: Passbook fetch failed" });
  }
};

/* =============================================
    ✏️ UPDATE EXPENSE
============================================= */
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { partyName, type, amount, adminName } = req.body;

    const oldExpense = await Expense.findById(id);
    if (!oldExpense) return res.status(404).json({ success: false, message: "Expense not found" });

    const updatedExpense = await Expense.findByIdAndUpdate(
      id, 
      { ...req.body, amount: toSafeNumber(amount) }, 
      { new: true, runValidators: true }
    );

    const actionDesc = `UPDATED: ${oldExpense.partyName} (₹${oldExpense.amount}) TO ${partyName} (₹${amount})`;
    await logAudit(adminName, actionDesc);

    res.status(200).json({ success: true, message: "Passbook updated ✅", data: updatedExpense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* =============================================
    🗑️ DELETE EXPENSE
============================================= */
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const adminName = req.query.adminName || "Admin";

    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });

    await Expense.findByIdAndDelete(id);

    const actionDesc = `DELETED: ${expense.type} of ₹${expense.amount} for ${expense.partyName}`;
    await logAudit(adminName, actionDesc);

    res.status(200).json({ success: true, message: "Entry removed from Passbook 🗑️" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};