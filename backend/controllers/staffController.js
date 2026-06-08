import Staff from "../models/Staff.js";
import { ROLES } from "../utils/constants.js";
import logger from "../utils/logger.js";
import bcrypt from "bcryptjs"; 
import mongoose from "mongoose";
import ActivityLog from "../saveoldfile/models/ActivityLog.js";

// 🔧 Core Helpers
const safeUpper = (v) => String(v || "").toUpperCase().trim();
const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);

/* ================= Helper: Audit Logger Matrix ================= */
const logAudit = async (adminName, action, module = "STAFF_MANAGEMENT") => {
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

        if (!password || password.trim().length < 4) {
            return res.status(400).json({ success: false, message: "Security PIN/Password (min 4 chars) is required." });
        }

        const finalSalary = Number(baseSalary || salary);
        if (isNaN(finalSalary) || finalSalary <= 0) {
            return res.status(400).json({ success: false, message: "Invalid salary value provided." });
        }

        if (!name) return res.status(400).json({ success: false, message: "Staff name is mandatory." });
        if (!isValidPhone(phone)) return res.status(400).json({ success: false, message: "Provide a valid 10-digit phone number." });

        const existing = await Staff.findOne({ phone });
        if (existing) return res.status(400).json({ success: false, message: "This phone number is already registered." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const staffData = {
            name: safeUpper(name),
            password: hashedPassword, 
            phone: phone.trim(),
            fatherName: safeUpper(fatherName),
            emergencyPhone: emergencyPhone ? emergencyPhone.trim() : null,
            address: address ? address.trim() : null,
            role: (role || ROLES?.WORKER || "WORKER").toUpperCase(),
            baseSalary: finalSalary,
            joiningDate: joiningDate || new Date(),
            status: "ACTIVE",

            kycDetails: {
                aadharNumber: req.body["kycDetails[aadharNumber]"] || kycDetails?.aadharNumber || req.body.aadhar || "[Aadhaar Redacted]",
                panNumber: safeUpper(req.body["kycDetails[panNumber]"] || kycDetails?.panNumber || req.body.panNumber || "")
            },

            bankDetails: {
                bankName: safeUpper(req.body["bankDetails[bankName]"] || bankDetails?.bankName || req.body.bankName || ""),
                accountNumber: req.body["bankDetails[accountNumber]"] || bankDetails?.accountNumber || req.body.accountNo || "",
                ifscCode: safeUpper(req.body["bankDetails[ifscCode]"] || bankDetails?.ifscCode || req.body.ifscCode || "")
            },

            photo: req.file ? (req.file.path || req.file.secure_url) : null,
            createdBy: req.user?._id
        };

        const staff = await Staff.create(staffData);
        logger.info(`👤 Staff Created: ${staff.employeeId} by Admin ID: ${req.user?._id}`);
        await logAudit(req.user?.name || "Admin", `Created new staff profile: ${staff.employeeId}`);

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
                .select("-password")
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
// 3. GET STAFF BY ID / EMPLOYEE_ID
// ==========================================
export const getStaffById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const criteria = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { employeeId: id.toUpperCase() };
        const staff = await Staff.findOne(criteria).select("-password");

        if (!staff) return res.status(404).json({ success: false, message: "Staff record missing." });

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
        const { id } = req.params;
        const { salary, baseSalary, role, isBlocked, password, name, fatherName, bankDetails, kycDetails, isSalaryModified, oldSalarySnapshot } = req.body;
        
        const criteria = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { employeeId: id.toUpperCase() };
        
        // Target profile tracking audit validations
        const currentStaff = await Staff.findOne(criteria);
        if (!currentStaff) return res.status(404).json({ success: false, message: "Staff record missing." });

        let updateFields = {};

        if (name) updateFields.name = safeUpper(name);
        if (fatherName) updateFields.fatherName = safeUpper(fatherName);
        
        // Salary Allocation Core Strategy Logic
        if (salary || baseSalary) {
            updateFields.baseSalary = Number(salary || baseSalary);
        }
        
        if (role) updateFields.role = role.toUpperCase();

        if (password && password.trim().length >= 4) {
            const salt = await bcrypt.genSalt(10);
            updateFields.password = await bcrypt.hash(password, salt);
        }

        if (isBlocked !== undefined) {
            const blockStatus = String(isBlocked) === "true";
            updateFields.status = blockStatus ? "LEFT" : "ACTIVE";
            updateFields.isBlocked = blockStatus; 
        }

        if (req.body.phone && isValidPhone(req.body.phone)) updateFields.phone = req.body.phone.trim();
        if (req.body.emergencyPhone) updateFields.emergencyPhone = req.body.emergencyPhone.trim();
        if (req.body.address) updateFields.address = req.body.address.trim();

        // 🚀 MULTIPART LAYERS SAFETY SYNC
        updateFields["kycDetails.aadharNumber"] = req.body["kycDetails[aadharNumber]"] || kycDetails?.aadharNumber || req.body.aadhar || currentStaff.kycDetails?.aadharNumber;
        
        if (req.body["kycDetails[panNumber]"] || kycDetails?.panNumber) {
            updateFields["kycDetails.panNumber"] = safeUpper(req.body["kycDetails[panNumber]"] || kycDetails.panNumber);
        }

        if (req.body["bankDetails[bankName]"] || bankDetails?.bankName || req.body.bankName) {
            updateFields["bankDetails.bankName"] = safeUpper(req.body["bankDetails[bankName]"] || bankDetails?.bankName || req.body.bankName);
        }

        if (req.body["bankDetails[accountNumber]"] || bankDetails?.accountNumber || req.body.accountNo) {
            updateFields["bankDetails.accountNumber"] = req.body["bankDetails[accountNumber]"] || bankDetails?.accountNumber || req.body.accountNo;
        }

        if (req.body["bankDetails[ifscCode]"] || bankDetails?.ifscCode || req.body.ifscCode) {
            updateFields["bankDetails.ifscCode"] = safeUpper(req.body["bankDetails[ifscCode]"] || bankDetails?.ifscCode || req.body.ifscCode);
        }

        if (req.file) updateFields.photo = req.file.path || req.file.secure_url;

        // 🚀 AUDIT TRACKER INTEGRATION: If salary change is true log metadata events
        if (isSalaryModified === "true" || (updateFields.baseSalary && currentStaff.baseSalary !== updateFields.baseSalary)) {
            const prevSal = oldSalarySnapshot || currentStaff.baseSalary || 0;
            await logAudit(
                req.user?.name || "Admin", 
                `Salary Modified for ${currentStaff.employeeId}: Changed from ₹${prevSal} to ₹${updateFields.baseSalary}`,
                "PAYROLL_MUTATION"
            );
        }

        const staff = await Staff.findOneAndUpdate(
            criteria,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select("-password");

        logger.info(`✏️ Staff Sync: ${staff.employeeId} updated successfully.`);
        await logAudit(req.user?.name || "Admin", `Updated staff dashboard values for: ${staff.employeeId}`);

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
        const { id } = req.params;
        const criteria = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { employeeId: id.toUpperCase() };

        const staff = await Staff.findOne(criteria);
        if (!staff) return res.status(404).json({ success: false, message: "Staff not found." });

        staff.status = "LEFT";
        staff.isBlocked = true;
        staff.leftDate = new Date();
        await staff.save();

        logger.warn(`⚠️ Staff Terminated: ${staff.employeeId}`);
        await logAudit(req.user?.name || "Admin", `Revoked access parameters for: ${staff.employeeId}`);

        res.status(200).json({
            success: true,
            message: `Staff ${staff.name} access revoked from ERP panel system.`
        });
    } catch (error) {
        next(error);
    }
};