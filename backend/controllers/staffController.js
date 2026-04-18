import Staff from "../models/Staff.js";
import { ROLES } from "../utils/constants.js";
import logger from "../utils/logger.js";
import bcrypt from "bcryptjs"; // Password hashing ke liye zaroori hai

// 🔧 Helpers
const safeUpper = (v) => String(v || "").toUpperCase();
const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);

// ==========================================
// 1. CREATE STAFF (v3 Robust & Secure)
// ==========================================
export const createStaff = async (req, res, next) => {
    try {
        let { 
            phone, name, password, role,
            fatherName, emergencyPhone, address, joiningDate,
            baseSalary, salary,
            bankDetails, kycDetails 
        } = req.body;

        // 🔴 1. Password Validation
        if (!password || password.trim().length < 4) {
            return res.status(400).json({ success: false, message: "Security PIN/Password (min 4 chars) is required." });
        }

        // 🔴 2. Salary Handling (Fix for "Invalid salary")
        const finalSalary = Number(baseSalary || salary);
        if (isNaN(finalSalary) || finalSalary <= 0) {
            return res.status(400).json({ success: false, message: "Invalid salary value provided." });
        }

        // 🔴 3. General Validation
        if (!name) return res.status(400).json({ success: false, message: "Staff name is mandatory." });
        if (!isValidPhone(phone)) return res.status(400).json({ success: false, message: "Provide a valid 10-digit phone number." });

        // 🔴 4. Duplicate Check
        const existing = await Staff.findOne({ phone });
        if (existing) return res.status(400).json({ success: false, message: "This phone number is already registered." });

        // 🔒 Hash Password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 🔥 5. Build Object
        const staffData = {
            name: safeUpper(name),
            password: hashedPassword, 
            phone,
            fatherName: safeUpper(fatherName),
            emergencyPhone,
            address,
            role: (role || ROLES.WORKER).toUpperCase(),
            baseSalary: finalSalary,
            joiningDate: joiningDate || new Date(),
            status: "ACTIVE",

            // Mapping nested objects from FormData fallback keys
            kycDetails: {
                aadharNumber: req.body["kycDetails[aadharNumber]"] || kycDetails?.aadharNumber || req.body.aadhar || "[Aadhaar Redacted]"
            },

            bankDetails: {
                bankName: safeUpper(req.body["bankDetails[bankName]"] || bankDetails?.bankName || req.body.bankName),
                accountNumber: req.body["bankDetails[accountNumber]"] || bankDetails?.accountNumber || req.body.accountNo,
                ifscCode: safeUpper(req.body["bankDetails[ifscCode]"] || bankDetails?.ifscCode || req.body.ifscCode)
            },

            // Multer Image path handling
            photo: req.file ? `/uploads/staff/${req.file.filename}` : null,
            createdBy: req.user?._id
        };

        const staff = await Staff.create(staffData);

        logger.info(`👤 Staff Created: ${staff.employeeId} by Admin ID: ${req.user?._id}`);

        res.status(201).json({
            success: true,
            message: "Staff registered successfully",
            data: {
                _id: staff._id,
                employeeId: staff.employeeId,
                name: staff.name,
                role: staff.role
            }
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages[0] });
        }
        next(error);
    }
};

// ==========================================
// 2. GET ALL STAFF (Paginated & Filtered)
// ==========================================
export const getAllStaff = async (req, res, next) => {
    try {
        const { role, status, search, page = 1, limit = 50 } = req.query;

        let query = {};
        if (role && role !== "ALL") query.role = role.toUpperCase();
        if (status) query.status = status.toUpperCase();

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { employeeId: { $regex: search, $options: "i" } }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [staffList, total] = await Promise.all([
            Staff.find(query)
                .select("-password") // 🔒 Never expose hashed passwords
                .sort({ name: 1 })
                .skip(skip)
                .limit(Number(limit)),
            Staff.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            data: staffList
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 3. GET STAFF BY ID
// ==========================================
export const getStaffById = async (req, res, next) => {
    try {
        const staff = await Staff.findById(req.params.id).select("-password");

        if (!staff) return res.status(404).json({ success: false, message: "Staff not found." });

        res.status(200).json({
            success: true,
            data: staff
        });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// 4. UPDATE STAFF (Master Control Sync)
// ==========================================
export const updateStaff = async (req, res, next) => {
    try {
        const { salary, baseSalary, role, isBlocked, password, name } = req.body;
        let updateData = { ...req.body };

        // Normalize specific fields
        if (name) updateData.name = safeUpper(name);
        if (salary || baseSalary) updateData.baseSalary = Number(salary || baseSalary);
        if (role) updateData.role = role.toUpperCase();

        // 🔒 If password update requested, re-hash it
        if (password && password.trim().length >= 4) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        // 🛡️ Security Block logic from MasterPanel
        if (isBlocked !== undefined) {
            updateData.status = isBlocked ? "LEFT" : "ACTIVE";
            updateData.isBlocked = isBlocked; // Track explicitly
        }

        // Nested mapping for nested schema fields
        if (req.body.aadhar) updateData["kycDetails.aadharNumber"] = req.body.aadhar;
        if (req.body.bankName) updateData["bankDetails.bankName"] = safeUpper(req.body.bankName);
        if (req.body.accountNo) updateData["bankDetails.accountNumber"] = req.body.accountNo;
        if (req.body.ifscCode) updateData["bankDetails.ifscCode"] = safeUpper(req.body.ifscCode);

        const staff = await Staff.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");

        if (!staff) return res.status(404).json({ success: false, message: "Staff record missing." });

        logger.info(`✏️ Staff Sync: ${staff.employeeId} updated by ${req.user?._id}`);

        res.status(200).json({
            success: true,
            message: "Staff profile updated successfully",
            data: staff
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 5. DELETE STAFF (Soft Delete Protocol)
// ==========================================
export const deleteStaff = async (req, res, next) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) return res.status(404).json({ success: false, message: "Staff not found." });

        staff.status = "LEFT";
        staff.isBlocked = true;
        staff.leftDate = new Date();
        await staff.save();

        logger.warn(`⚠️ Staff Terminated: ${staff.employeeId}`);

        res.status(200).json({
            success: true,
            message: `Staff ${staff.name} access revoked.`
        });
    } catch (error) {
        next(error);
    }
};