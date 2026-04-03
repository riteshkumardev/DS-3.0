import Expense from "../models/Expense.js";
import ActivityLog from "../models/activityLog.js";

/* =============================================
    📜 Helper: Audit Logger
============================================= */
const logAudit = async (adminName, action, module = "EXPENSE") => {
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

// ➕ Add Transaction
export const addExpense = async (req, res) => {
  try {
    const { partyName, type, amount, adminName } = req.body;
    const time = new Date().toLocaleTimeString();
    
    const expense = await Expense.create({ ...req.body, time });

    const actionDesc = `ADDED: ${type} ₹${Number(amount).toLocaleString()} - ${partyName}`;
    await logAudit(adminName, actionDesc);

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 📄 Get Passbook Data
export const getExpenses = async (req, res) => {
  try {
    const transactions = await Expense.find().sort({ date: -1, createdAt: -1 });

    const totalIn = await Expense.aggregate([
      { $match: { type: "Payment In" } },
      { $group: { _id: null, sum: { $sum: { $toDouble: "$amount" } } } }
    ]);

    const totalOut = await Expense.aggregate([
      { $match: { type: "Payment Out" } },
      { $group: { _id: null, sum: { $sum: { $toDouble: "$amount" } } } }
    ]);

    const sumIn = totalIn[0]?.sum || 0;
    const sumOut = totalOut[0]?.sum || 0;

    res.status(200).json({
      success: true,
      data: transactions,
      totalIn: sumIn,
      totalOut: sumOut,
      netBalance: sumIn - sumOut 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ✏️ Update Transaction (New)
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { partyName, type, amount, adminName } = req.body;

    // Find old data first for the audit log comparison
    const oldExpense = await Expense.findById(id);
    if (!oldExpense) return res.status(404).json({ success: false, message: "Not Found" });

    const updatedExpense = await Expense.findByIdAndUpdate(
      id, 
      { ...req.body }, 
      { new: true }
    );

    // ✅ AUDIT LOG: Record the Change
    const actionDesc = `UPDATED: ${oldExpense.partyName} (₹${oldExpense.amount}) TO ${partyName} (₹${amount})`;
    await logAudit(adminName, actionDesc);

    res.status(200).json({ success: true, message: "Updated successfully", data: updatedExpense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 🗑️ Delete Transaction (New)
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const adminName = req.query.adminName || "Admin"; // Frontend can pass this in URL params

    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ success: false, message: "Not Found" });

    await Expense.findByIdAndDelete(id);

    // ✅ AUDIT LOG: Record the Deletion
    const actionDesc = `DELETED: ${expense.type} of ₹${expense.amount} for ${expense.partyName}`;
    await logAudit(adminName, actionDesc);

    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};