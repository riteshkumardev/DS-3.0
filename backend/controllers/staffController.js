// staffController.js
import Staff from "../models/Staff.js";
import { ROLES } from "../utils/constants.js";
import logger from "../utils/logger.js";

/**
 * Professional Staff Controller (Full CRUD with Advanced Filters)
 * Dharashakti Agro Products ERP
 */

// 1. CREATE STAFF
export const createStaff = async (req, res, next) => {
    try {
        const { employeeId, phone, name } = req.body;

        // Check for existing employee
        const existingStaff = await Staff.findOne({ 
            $or: [{ employeeId }, { phone }] 
        });
        
        if (existingStaff) {
            res.status(400);
            throw new Error("Employee ID or Phone already exists");
        }

        const staff = new Staff({
            ...req.body,
            name: name.toUpperCase()
        });

        const savedStaff = await staff.save();
        res.status(201).json({ success: true, data: savedStaff });
    } catch (error) {
        next(error);
    }
};

// 2. GET ALL STAFF (With Advanced Filtering)
export const getAllStaff = async (req, res, next) => {
    try {
        const { role, status, search, city } = req.query;
        let query = {};

        // Filter by Role
        if (role && role !== 'ALL') {
            query.role = role;
        }

        // Filter by Status (Active/Left)
        if (status) {
            query.status = status;
        }

        // Filter by City
        if (city) {
            query['address.city'] = { $regex: city, $options: 'i' };
        }

        // Search by Name or Phone
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } }
            ];
        }

        const staffList = await Staff.find(query).sort({ name: 1 });
        
        res.status(200).json({ 
            success: true, 
            count: staffList.length, 
            data: staffList 
        });
    } catch (error) {
        next(error);
    }
};

// 3. GET STAFF BY ID (With Basic Stats)
export const getStaffById = async (req, res, next) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            res.status(404);
            throw new Error("Staff member not found");
        }
        res.status(200).json({ success: true, data: staff });
    } catch (error) {
        next(error);
    }
};

// 4. UPDATE STAFF DETAILS
export const updateStaff = async (req, res, next) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            res.status(404);
            throw new Error("Staff member not found");
        }

        const updatedStaff = await Staff.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.status(200).json({ 
            success: true, 
            message: "Staff details updated", 
            data: updatedStaff 
        });
    } catch (error) {
        next(error);
    }
};

// 5. DELETE/TERMINATE STAFF
export const deleteStaff = async (req, res, next) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            res.status(404);
            throw new Error("Staff member not found");
        }

        // Professional Approach: Hard delete ke bajaye status 'LEFT' ya 'TERMINATED' karein
        // Taaki purane records (Attendance/Salary) na bigdein.
        staff.status = 'LEFT';
        await staff.save();

        res.status(200).json({ 
            success: true, 
            message: "Staff marked as LEFT. Records preserved for audit." 
        });
    } catch (error) {
        next(error);
    }
};