import SalaryPayment from "../models/SalaryPayment.js";
import Transaction from "../models/Transaction.js"; // 🆕 Cash balance sync ke liye
import Employee from "../models/epmloyee.js";     // 🆕 Employee verify karne ke liye
import ActivityLog from "../models/ActivityLog.js"; 
import mongoose from "mongoose";

/* =============================================
    📜 Helper: Audit Logger
============================================= */
const logAudit = async (adminName, action, module = "PAYROLL") => {
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
    ✅ 1. GET PAYMENT HISTORY (Employee Specific)
============================================= */
export const getPaymentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    // Database se history nikalna (Newest first)
    const data = await SalaryPayment.find({ employeeId: id }).sort({ date: -1 });
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "History fetch fail: " + err.message });
  }
};

/* =============================================
    ✅ 2. ADD PAYMENT / ADVANCE (Smart Sync)
============================================= */
export const addPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payload = req.body;
    const { employeeId, amount, type, adminName, date, paymentMethod } = payload;

    if (!employeeId || !amount) {
      throw new Error("Employee ID aur Amount zaroori hai!");
    }

    // 1. Employee Verify Karein
    const emp = await Employee.findOne({ employeeId }).session(session);
    if (!emp) throw new Error("Employee nahi mila!");

    const finalAmount = toNum(amount);
    const finalDate = date || new Date().toISOString().split('T')[0];

    // 2. Salary/Advance Record Create Karein
    const [payment] = await SalaryPayment.create([{
      ...payload,
      amount: finalAmount,
      date: finalDate,
      name: emp.name // Record ke liye naam bhi save kar rahe hain
    }], { session });

    // 3. 🆕 TRANSACTION SYNC (Taki Cash/Bank balance kam ho)
    await Transaction.create([{
      partyId: emp._id,
      partyModel: 'Employee',
      partyName: emp.name,
      type: 'OUT', // Paisa business se bahar gaya
      amount: finalAmount,
      description: `${type === 'Advance' ? 'Salary Advance' : 'Monthly Salary'} Paid to ${emp.name}`,
      remainingBalance: 0, // Employee ledger mein cumulative balance hum calculate karenge
      paymentMethod: paymentMethod || "Cash",
      date: finalDate,
      refNo: payment._id.toString().slice(-6).toUpperCase() // Unique Ref No
    }], { session });

    // 4. Audit Log
    const actionDesc = `${type}: ₹${finalAmount.toLocaleString()} paid to ${emp.name} (${employeeId})`;
    await logAudit(adminName, actionDesc);

    await session.commitTransaction();
    res.status(201).json({ success: true, message: "Salary/Advance Paid Successfully ✅", data: payment });

  } catch (error) {
    await session.abortTransaction();
    console.error("PAYROLL ERROR:", error.message);
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/* =============================================
    ✅ 3. DELETE PAYMENT (Reverse Logic)
============================================= */
export const deletePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const adminName = req.query.adminName;

    const payment = await SalaryPayment.findById(id).session(session);
    if (!payment) throw new Error("Payment record nahi mila");

    // Transaction delete karein jo is payment se juda tha
    // Hamne refNo use kiya tha, ya description se match kar sakte hain
    await Transaction.deleteMany({ 
      partyName: payment.name, 
      date: payment.date,
      amount: payment.amount 
    }).session(session);

    await SalaryPayment.findByIdAndDelete(id).session(session);

    await logAudit(adminName, `⚠️ DELETE: Salary/Advance Payment of ₹${payment.amount} for ${payment.name}`);
    
    await session.commitTransaction();
    res.json({ success: true, message: "Payment Deleted & Ledger Adjusted ✅" });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};