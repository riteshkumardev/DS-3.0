import Employee from "../models/epmloyee.js";
import ActivityLog from "../models/activityLog.js";
import bcrypt from "bcryptjs";
import fs from "fs";

/**
 * ✅ 1. CREATE EMPLOYEE
 */
export const createEmployee = async (req, res) => {
  try {
    const { name, aadhar, salary, password, role, designation } = req.body;

    if (!name || !aadhar || !salary || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, Aadhar, Salary and Password are required"
      });
    }

    const existing = await Employee.findOne({ aadhar });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Aadhar already exists"
      });
    }

    // 🔐 Password Hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🆔 Unique Employee ID
    let employeeId;
    let exists = true;

    while (exists) {
      employeeId = Math.floor(10000000 + Math.random() * 90000000).toString();
      exists = await Employee.findOne({ employeeId });
    }

    // 📸 Photo Path
    const photoPath = req.file ? req.file.path : "";

    const employee = await Employee.create({
      ...req.body,
      employeeId,
      password: hashedPassword,
      photo: photoPath,   // ✅ Correct field
      salary: Number(salary),
      role: role || designation || "Worker",
      isBlocked: false
    });

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message
    });
  }
};

/**
 * ✅ 2. GET ALL EMPLOYEES
 */
export const getAllEmployees = async (req, res) => {
  try {

    const employees = await Employee.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: employees
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching employees"
    });
  }
};

/**
 * ✅ 3. UPDATE EMPLOYEE
 */
export const updateEmployeeStatus = async (req, res) => {
  try {

    const { employeeId } = req.params;
    const updateData = { ...req.body };
    const adminName = updateData.adminName || "Admin";

    delete updateData.password;
    delete updateData.employeeId;

    const employee = await Employee.findOne({ employeeId });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // 📸 If new photo uploaded
    if (req.file) {

      // Delete old photo
      if (employee.photo && fs.existsSync(employee.photo)) {
        fs.unlinkSync(employee.photo);
      }

      updateData.photo = req.file.path;
    }

    const updatedEmployee = await Employee.findOneAndUpdate(
      { employeeId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    await ActivityLog.create({
      adminName,
      action: `Updated Employee: ${updatedEmployee.name} (ID: ${employeeId})`,
      module: "EMPLOYEE_UPDATE",
      createdAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: updatedEmployee
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Update failed: " + error.message
    });
  }
};

/**
 * ✅ 4. DELETE EMPLOYEE
 */
export const deleteEmployee = async (req, res) => {
  try {

    const { id } = req.params;

    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Delete photo from server
    if (employee.photo && fs.existsSync(employee.photo)) {
      fs.unlinkSync(employee.photo);
    }

    await Employee.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Delete failed"
    });
  }
};