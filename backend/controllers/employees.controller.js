import mongoose from "mongoose";
import Employee from "../models/Employee.js"; // ✅ Typo Fixed (epmloyee -> employee)
import ActivityLog from "../models/ActivityLog.js"; // ✅ Case-Sensitive Fixed
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

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
 * ✅ 1. CREATE EMPLOYEE
 */
export const createEmployee = async (req, res) => {
  try {
    const { name, aadhar, salary, password, role, designation } = req.body;

    if (!name || !aadhar || !salary || !password) {
      return res.status(400).json({ success: false, message: "Required fields missing!" });
    }

    const existing = await Employee.findOne({ aadhar });
    if (existing) {
      return res.status(409).json({ success: true, message: "Aadhar already registered" });
    }

    // 🔐 Password Hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🆔 Unique Employee ID (Dharashakti Format: DS-XXXX)
    let employeeId;
    let exists = true;
    while (exists) {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      employeeId = `DS-${randomId}`;
      exists = await Employee.findOne({ employeeId });
    }

    const employee = await Employee.create({
      ...req.body,
      employeeId,
      password: hashedPassword,
      photo: req.file ? req.file.path : "",
      salary: Number(salary),
      role: role || designation || "Worker",
      isBlocked: false
    });

    await logAudit(req.body.adminName, `Created Employee: ${name} (ID: ${employeeId})`);

    res.status(201).json({ success: true, message: "Employee Created ✅", data: employee });

  } catch (error) {
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
 * ✅ 3. UPDATE EMPLOYEE
 */
export const updateEmployeeStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const updateData = { ...req.body };

    const employee = await Employee.findOne({ employeeId });
    if (!employee) return res.status(404).json({ success: false, message: "Not Found" });

    // 📸 If new photo uploaded, delete old one from disk
    if (req.file) {
      if (employee.photo && fs.existsSync(employee.photo)) {
        fs.unlinkSync(employee.photo);
      }
      updateData.photo = req.file.path;
    }

    const updatedEmployee = await Employee.findOneAndUpdate(
      { employeeId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    await logAudit(req.body.adminName, `Updated Employee: ${updatedEmployee.name} (${employeeId})`);

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
    const employee = await Employee.findById(id);

    if (!employee) return res.status(404).json({ success: false, message: "Not Found" });

    // Cleanup: Delete photo from 'uploads' folder
    if (employee.photo && fs.existsSync(employee.photo)) {
      fs.unlinkSync(employee.photo);
    }

    await Employee.findByIdAndDelete(id);
    await logAudit(req.query.adminName, `Deleted Employee: ${employee.name}`);

    res.status(200).json({ success: true, message: "Employee Deleted 🗑️" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};