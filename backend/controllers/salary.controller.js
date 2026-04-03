import SalaryPayment from "../models/SalaryPayment.js";
import ActivityLog from "../models/activityLog.js"; // ✅ Audit Model import kiya

/* =============================================
    📜 Helper: Audit Logger
============================================= */
const logAudit = async (adminName, action, module = "PAYROLL") => {
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

// ✅ 1. Kisi specific employee ki payment history nikalna
export const getPaymentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    // Database se history nikalna
    const data = await SalaryPayment.find({ employeeId: id }).sort({ date: -1 });
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ✅ 2. Naya payment/advance add karna (Audit Enabled)
export const addPayment = async (req, res) => {
  try {
    const payload = req.body;
    
    // Payment record create karein
    const payment = await SalaryPayment.create(payload);

    // ✅ AUDIT LOG: Payment/Advance Disbursement
    const amountStr = Number(payload.amount).toLocaleString();
    await logAudit(
      payload.adminName, 
      `Salary/Advance Paid: ₹${amountStr} disbursed to Employee ID: ${payload.employeeId} on ${payload.date}`
    );

    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    console.error("Create Error:", err);
    res.status(400).json({ success: false, message: "Invalid Data or Missing Fields" });
  }
};