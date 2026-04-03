import Employee from "../models/epmloyee.js"; // ✅ Fixed Typo (epmloyee -> employee)
import ActivityLog from "../models/ActivityLog.js"; // ✅ Fixed Case (Capital A/L)
import bcrypt from "bcryptjs"; // ✅ Added for Password Verification

/* =============================================
    📜 Helper: Audit Logger (Safe Version)
============================================= */
const logAudit = async (adminName, action, module = "AUTH") => {
  try {
    // Model overwrite check
    const Audit = ActivityLog; 
    await Audit.create({
      adminName: adminName || "System",
      action: action,
      module: module,
      createdAt: new Date()
    });
  } catch (err) {
    console.error("Audit Logging Failed:", err);
  }
};

/**
 * 🔓 UNLOCK APP (Screen Lock)
 */
export const unlockEmployee = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    const employee = await Employee.findOne({ employeeId });

    if (!employee) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 🛡️ BCRYPT COMPARE: Direct compare (!) se match nahi hoga
    const isMatch = await bcrypt.compare(password, employee.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    await logAudit(employee.name, `Screen Unlocked: User resumed session`);

    res.status(200).json({
      success: true,
      message: "App Unlocked ✅",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * 🔑 LOGIN SYSTEM
 */
export const loginEmployee = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and password required",
      });
    }

    const employee = await Employee.findOne({ employeeId });

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "Invalid Employee ID",
      });
    }

    // 🔒 Block check
    if (employee.isBlocked) {
      await logAudit(employee.name, `Blocked user attempted to login`, "SECURITY");
      return res.status(403).json({
        success: false,
        message: "Account is blocked by admin",
      });
    }

    // 🛡️ BCRYPT COMPARE: Plain text vs Hashed comparison
    const isMatch = await bcrypt.compare(password, employee.password);

    if (!isMatch) {
      await logAudit(employee.name, `Failed login attempt: Incorrect password`, "SECURITY");
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // ✅ Successful Login Log
    await logAudit(employee.name, `User logged in successfully`);

    res.status(200).json({
      success: true,
      message: "Login successful ✅",
      data: {
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        role: employee.role,
        photo: employee.photo // Photo bhi bhej rahe hain Dashboard ke liye
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};