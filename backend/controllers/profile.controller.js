import Employee from "../models/epmloyee.js"; 
import ActivityLog from "../models/activityLog.js";
import fs from "fs/promises"; // Async version for better performance
import path from "path";

/* ================= Helper: Audit Logger ================= */
const logAudit = async (adminName, action, module = "PROFILE") => {
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

/* ================= IMAGE UPLOAD ================= */
export const uploadProfileImage = async (req, res) => {
  try {
    const { employeeId, adminName } = req.body;

    if (!req.file || !employeeId) {
      return res.status(400).json({ success: false, message: "Image or employeeId missing" });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

    // Old photo delete logic
    if (employee.photo) {
      const oldFilePath = path.join(process.cwd(), employee.photo);
      try { await fs.unlink(oldFilePath); } catch (e) { /* file already gone */ }
    }

    const imagePath = `/uploads/${req.file.filename}`;
    employee.photo = imagePath;
    await employee.save();

    await logAudit(adminName || employee.name, "Profile photo updated", "MEDIA");
    res.json({ success: true, message: "Profile photo updated successfully", photo: imagePath });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error during upload" });
  }
};

/* ================= UPDATE PROFILE DETAILS ================= */
export const updateProfile = async (req, res) => {
  try {
    const { employeeId, name, phone, adminName } = req.body;

    const employee = await Employee.findOneAndUpdate(
      { employeeId },
      { name, phone },
      { new: true }
    );

    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

    await logAudit(adminName || employee.name, `Profile details (Name/Phone) updated`);
    res.json({ success: true, message: "Profile updated successfully", data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

/* ================= CHANGE PASSWORD ================= */
export const changePassword = async (req, res) => {
  try {
    const { employeeId, password, adminName } = req.body; 

    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, message: "Password too short" });
    }

    const employee = await Employee.findOneAndUpdate(
      { employeeId },
      { password: password }, 
      { new: true }
    );

    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

    await logAudit(adminName || employee.name, `Security Alert: Password changed`, "SECURITY");
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Password update failed" });
  }
};

/* ================= LOGOUT ================= */
export const logoutUser = async (req, res) => {
  try {
    const { employeeId, adminName } = req.body;
    const employee = await Employee.findOne({ employeeId });
    
    await Employee.findOneAndUpdate({ employeeId }, { currentSessionId: null });

    await logAudit(adminName || employee?.name || "User", `User logged out`, "SESSION");
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};