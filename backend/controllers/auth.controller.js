import Employee from "../models/epmloyee.js";
import ActivityLog from "../models/activityLog.js"; // ✅ Audit Model import kiya

/* =============================================
    📜 Helper: Audit Logger
============================================= */
const logAudit = async (adminName, action, module = "AUTH") => {
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

/**
 * 🔓 UNLOCK APP (Screen Lock)
 */
export const unlockEmployee = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    const employee = await Employee.findOne({ employeeId });

    if (!employee || employee.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // ✅ AUDIT LOG: Screen Unlocked
    await logAudit(employee.name, `Screen Unlocked: User resumed session`);

    res.status(200).json({
      success: true,
      message: "App Unlocked",
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
      // ✅ AUDIT LOG: Failed Login Attempt (Blocked User)
      await logAudit(employee.name, `Blocked user attempted to login`, "SECURITY");
      
      return res.status(403).json({
        success: false,
        message: "Account is blocked by admin",
      });
    }

    if (employee.password !== password) {
      // ✅ AUDIT LOG: Wrong Password Attempt
      await logAudit(employee.name, `Failed login attempt: Incorrect password`, "SECURITY");

      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // ✅ AUDIT LOG: Successful Login
    await logAudit(employee.name, `User logged in successfully`);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        role: employee.role,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};