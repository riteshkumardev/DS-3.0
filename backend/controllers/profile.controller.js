import Employee from "../models/Employee.js"; 
import ActivityLog from "../models/ActivityLog.js"; 
import bcrypt from "bcryptjs"; 

/* ==========================================================
   📜 Helper: Audit Logger
   ========================================================== */
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

/* ==========================================================
   📸 IMAGE UPLOAD (Cloudinary Version - NO LOCAL FS)
   ========================================================== */
export const uploadProfileImage = async (req, res) => {
  try {
    const { employeeId, adminName } = req.body;

    // 1. Validation
    if (!req.file || !employeeId) {
      return res.status(400).json({ 
        success: false, 
        message: "Image or employeeId missing" 
      });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: "Employee not found" 
      });
    }

    // 2. Cloudinary Path logic
    // req.file.path mein Cloudinary ka HTTPS URL hota hai
    const imagePath = req.file.path; 

    // 3. Update Database
    employee.photo = imagePath;
    await employee.save();

    // 4. Audit Log
    await logAudit(adminName || employee.name, "Profile photo updated (Cloudinary)", "MEDIA");

    res.json({ 
      success: true, 
      message: "Profile photo updated successfully ✅", 
      photo: imagePath 
    });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error during upload" 
    });
  }
};

/* ==========================================================
   ✏️ UPDATE PROFILE DETAILS
   ========================================================== */
export const updateProfile = async (req, res) => {
  try {
    const { employeeId, name, phone, adminName } = req.body;

    const employee = await Employee.findOneAndUpdate(
      { employeeId },
      { name, phone },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: "Employee not found" 
      });
    }

    await logAudit(adminName || employee.name, `Profile updated: ${name} (${phone})`);
    res.json({ 
      success: true, 
      message: "Profile updated successfully ✅", 
      data: employee 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

/* ==========================================================
   🔐 CHANGE PASSWORD
   ========================================================== */
export const changePassword = async (req, res) => {
  try {
    const { employeeId, password, adminName } = req.body; 

    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 6 characters" 
      });
    }

    // Security: Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const employee = await Employee.findOneAndUpdate(
      { employeeId },
      { password: hashedPassword }, 
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: "Employee not found" 
      });
    }

    await logAudit(adminName || employee.name, `Security Alert: Password changed`, "SECURITY");
    res.json({ success: true, message: "Password updated successfully ✅" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Password update failed" });
  }
};

/* ==========================================================
   🚪 LOGOUT
   ========================================================== */
export const logoutUser = async (req, res) => {
  try {
    const { employeeId, adminName } = req.body;
    
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