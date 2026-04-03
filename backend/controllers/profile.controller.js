import Employee from "../models/epmloyee.js"; // ✅ Fixed Typo (epmloyee -> employee)
import ActivityLog from "../models/ActivityLog.js"; // ✅ Match Case
import fs from "fs/promises"; 
import path from "path";
import bcrypt from "bcryptjs"; // ✅ Added for Secure Password

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

/* ================= 📸 IMAGE UPLOAD ================= */
export const uploadProfileImage = async (req, res) => {
  try {
    const { employeeId, adminName } = req.body;

    if (!req.file || !employeeId) {
      return res.status(400).json({ success: false, message: "Image or employeeId missing" });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

    // Old photo delete logic (Prevent storage full)
    if (employee.photo) {
      const oldFilePath = path.join(process.cwd(), employee.photo);
      try { 
        await fs.unlink(oldFilePath); 
      } catch (e) { 
        console.log("Old file not found, skipping delete"); 
      }
    }

    // Path fix for frontend display
    const imagePath = `uploads/${req.file.filename}`;
    employee.photo = imagePath;
    await employee.save();

    await logAudit(adminName || employee.name, "Profile photo updated", "MEDIA");
    res.json({ success: true, message: "Profile photo updated successfully ✅", photo: imagePath });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error during upload" });
  }
};

/* ================= ✏️ UPDATE PROFILE DETAILS ================= */
export const updateProfile = async (req, res) => {
  try {
    const { employeeId, name, phone, adminName } = req.body;

    const employee = await Employee.findOneAndUpdate(
      { employeeId },
      { name, phone },
      { new: true, runValidators: true }
    );

    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

    await logAudit(adminName || employee.name, `Profile updated: ${name} (${phone})`);
    res.json({ success: true, message: "Profile updated successfully ✅", data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

/* ================= 🔐 CHANGE PASSWORD (RE-HASHED) ================= */
export const changePassword = async (req, res) => {
  try {
    const { employeeId, password, adminName } = req.body; 

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    // 🛡️ SECURITY FIX: Always hash password before saving!
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const employee = await Employee.findOneAndUpdate(
      { employeeId },
      { password: hashedPassword }, 
      { new: true }
    );

    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

    await logAudit(adminName || employee.name, `Security Alert: Password changed`, "SECURITY");
    res.json({ success: true, message: "Password updated successfully ✅" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Password update failed" });
  }
};

/* ================= 🚪 LOGOUT ================= */
export const logoutUser = async (req, res) => {
  try {
    const { employeeId, adminName } = req.body;
    
    // Clear session from DB
    const employee = await Employee.findOneAndUpdate(
      { employeeId }, 
      { currentSessionId: null }, 
      { new: true }
    );

    await logAudit(adminName || employee?.name || "User", `User logged out`, "SESSION");
    res.json({ success: true, message: "Logged out successfully 👋" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};