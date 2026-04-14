import mongoose from "mongoose";
import Employee from "../models/Employee.js"; // ✅ Fixed Typo
import ActivityLog from "../models/ActivityLog.js"; // ✅ Match Case
import bcrypt from "bcryptjs";

/* =============================================
    📜 Helper: Audit Logger
============================================= */
const logAudit = async (adminName, action, module = "EMPLOYEE") => {
  try {
    await ActivityLog.create({
      adminName: adminName || "System",
      action,
      module,
    });
  } catch (err) {
    console.error("Audit Logging Failed:", err);
  }
};

/**
 * ✅ 1. CREATE EMPLOYEE (With Cloudinary)
 */
export const createEmployee = async (req, res) => {
  try {
    const { name, aadhar, salary, password, role, designation, adminName } = req.body;

    if (!name || !aadhar || !salary || !password) {
      return res.status(400).json({ success: false, message: "Required fields missing!" });
    }

    const existing = await Employee.findOne({ aadhar });
    if (existing) {
      return res.status(409).json({ success: false, message: "Aadhar already registered" });
    }

    // 🔐 Password Hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 🆔 Unique Employee ID (DS-XXXX)
    let employeeId;
    let exists = true;
    while (exists) {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      employeeId = `DS-${randomId}`;
      exists = await Employee.findOne({ employeeId });
    }

    // 📸 Photo Logic: req.file.path ab Cloudinary ka URL dega
    const photoUrl = req.file ? req.file.path : "";

    const employee = await Employee.create({
      ...req.body,
      employeeId,
      password: hashedPassword,
      photo: photoUrl,
      salary: Number(salary),
      role: role || designation || "Worker",
      isBlocked: false
    });

    await logAudit(adminName, `Created Employee: ${name} (ID: ${employeeId})`);

    res.status(201).json({ success: true, message: "Employee Created ✅", data: employee });

  } catch (error) {
    console.error("Create Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ 2. GET ALL EMPLOYEES
 */
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching list" });
  }
};

/**
 * ✅ 3. UPDATE EMPLOYEE STATUS / DATA
 */
export const updateEmployeeStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { adminName, ...updateData } = req.body;

    const employee = await Employee.findOne({ employeeId });
    if (!employee) return res.status(404).json({ success: false, message: "Employee Not Found" });

    // 📸 If new photo uploaded via Cloudinary
    if (req.file) {
      updateData.photo = req.file.path;
      // Note: Purani photo Cloudinary se delete karne ke liye extra logic chahiye hota hai, 
      // filhal hum sirf DB update kar rahe hain jo Vercel pe crash nahi hoga.
    }

    const updatedEmployee = await Employee.findOneAndUpdate(
      { employeeId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    await logAudit(adminName, `Updated Employee: ${updatedEmployee.name} (${employeeId})`);

    res.status(200).json({ success: true, message: "Updated successfully ✅", data: updatedEmployee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ 4. DELETE EMPLOYEE
 */
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminName } = req.query;

    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ success: false, message: "Not Found" });

    // DB delete
    await Employee.findByIdAndDelete(id);
    
    await logAudit(adminName, `Deleted Employee: ${employee.name}`);

    res.status(200).json({ success: true, message: "Employee Deleted 🗑️" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};