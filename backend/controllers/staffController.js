import Staff from "../models/Staff.js";
import { ROLES } from "../utils/constants.js";
import logger from "../utils/logger.js";

// 🔧 Helpers
const safeUpper = (v) => String(v || "").toUpperCase();
const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);

// ==========================================
// 1. CREATE STAFF
// ==========================================
export const createStaff = async (req, res, next) => {
    try {
        let { phone, name, salary, aadhar, bankName, accountNo, ifscCode } = req.body;

        // 🔴 Validation
        if (!name) throw new Error("Name is required");
        if (!isValidPhone(phone)) throw new Error("Invalid phone number");
        if (!salary || Number(salary) <= 0) throw new Error("Invalid salary");

        // 🔴 Duplicate check
        const existing = await Staff.findOne({ phone });
        if (existing) throw new Error("Phone already exists");

        // 🔥 Clean data
        const staffData = {
            name: safeUpper(name),
            phone,
            baseSalary: Number(salary),
            role: req.body.role || ROLES.STAFF,
            status: "ACTIVE",

            kycDetails: {
                aadharNumber: aadhar || null
            },

            bankDetails: {
                bankName: bankName || null,
                accountNumber: accountNo || null,
                ifscCode: ifscCode || null
            },

            address: req.body.address || {},
            createdBy: req.user?._id
        };

        const staff = await Staff.create(staffData);

        logger.info(`👤 Staff Created: ${staff.employeeId}`);

        res.status(201).json({
            success: true,
            message: "Staff created successfully",
            data: staff
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 2. GET ALL STAFF (WITH PAGINATION)
// ==========================================
export const getAllStaff = async (req, res, next) => {
    try {
        const {
            role,
            status,
            search,
            city,
            page = 1,
            limit = 20
        } = req.query;

        let query = {};

        if (role && role !== "ALL") query.role = role;
        if (status) query.status = status;

        if (city) {
            query["address.city"] = { $regex: city, $options: "i" };
        }

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
                .select("-bankDetails -kycDetails") // 🔒 hide sensitive data
                .sort({ createdAt: -1 })
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
        const staff = await Staff.findById(req.params.id)
            .select("-bankDetails.accountNumber"); // partial hide

        if (!staff) throw new Error("Staff not found");

        res.status(200).json({
            success: true,
            data: staff
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 4. UPDATE STAFF
// ==========================================
export const updateStaff = async (req, res, next) => {
    try {
        const { salary, aadhar, bankName, accountNo, ifscCode, name } = req.body;

        let updateData = {};

        if (name) updateData.name = safeUpper(name);
        if (salary) updateData.baseSalary = Number(salary);

        if (aadhar) updateData["kycDetails.aadharNumber"] = aadhar;

        if (bankName) updateData["bankDetails.bankName"] = bankName;
        if (accountNo) updateData["bankDetails.accountNumber"] = accountNo;
        if (ifscCode) updateData["bankDetails.ifscCode"] = ifscCode;

        if (req.body.address) updateData.address = req.body.address;
        if (req.body.status) updateData.status = req.body.status;

        const staff = await Staff.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!staff) throw new Error("Staff not found");

        logger.info(`✏️ Staff Updated: ${staff.employeeId}`);

        res.status(200).json({
            success: true,
            message: "Staff updated successfully",
            data: staff
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 5. DELETE STAFF (SOFT DELETE)
// ==========================================
export const deleteStaff = async (req, res, next) => {
    try {
        const staff = await Staff.findById(req.params.id);

        if (!staff) throw new Error("Staff not found");

        if (staff.status === "LEFT") {
            throw new Error("Staff already inactive");
        }

        staff.status = "LEFT";
        staff.leftDate = new Date();
        await staff.save();

        logger.warn(`⚠️ Staff Terminated: ${staff.employeeId}`);

        res.status(200).json({
            success: true,
            message: `Employee ${staff.name} marked as LEFT`
        });

    } catch (error) {
        next(error);
    }
};