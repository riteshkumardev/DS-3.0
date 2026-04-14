// staffController.js
import Staff from "../models/Staff.js";
import { ROLES } from "../utils/constants.js";
import logger from "../utils/logger.js";

/**
 * Professional Staff Controller - Updated for Dharashakti Agro Products ERP
 */

// 1. CREATE STAFF
export const createStaff = async (req, res, next) => {
    try {
        const { phone, name, salary, aadhar, bankName, accountNo, ifscCode } = req.body;

        // Check for existing employee by phone (Phone is unique)
        const existingStaff = await Staff.findOne({ phone });
        
        if (existingStaff) {
            res.status(400);
            throw new Error("Phone number already registered with another employee");
        }

        // Mapping Flat JSON to Schema Structure
        const staffData = {
            ...req.body,
            name: name.toUpperCase(),
            baseSalary: salary, // Mapping 'salary' to 'baseSalary'
            kycDetails: {
                aadharNumber: aadhar
            },
            bankDetails: {
                bankName: bankName,
                accountNumber: accountNo,
                ifscCode: ifscCode
            }
        };

        const staff = new Staff(staffData);
        const savedStaff = await staff.save();

        logger.info(`New Employee Created: ${savedStaff.employeeId}`);

        res.status(201).json({ 
            success: true, 
            message: "Employee created successfully",
            data: savedStaff 
        });
    } catch (error) {
        next(error);
    }
};

// 2. GET ALL STAFF (With Advanced Filtering)
export const getAllStaff = async (req, res, next) => {
    try {
        const { role, status, search, city } = req.query;
        let query = {};

        if (role && role !== 'ALL') query.role = role;
        if (status) query.status = status;

        // City filter (nested field check)
        if (city) {
            query['address.city'] = { $regex: city, $options: 'i' };
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } }
            ];
        }

        const staffList = await Staff.find(query).sort({ createdAt: -1 });
        
        res.status(200).json({ 
            success: true, 
            count: staffList.length, 
            data: staffList 
        });
    } catch (error) {
        next(error);
    }
};

// 3. GET STAFF BY ID
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
        const { salary, aadhar, bankName, accountNo, ifscCode } = req.body;

        // Prepare update object for nested fields
        let updateData = { ...req.body };
        
        if (salary) updateData.baseSalary = salary;
        if (aadhar) updateData['kycDetails.aadharNumber'] = aadhar;
        if (bankName) updateData['bankDetails.bankName'] = bankName;
        if (accountNo) updateData['bankDetails.accountNumber'] = accountNo;
        if (ifscCode) updateData['bankDetails.ifscCode'] = ifscCode;

        const updatedStaff = await Staff.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedStaff) {
            res.status(404);
            throw new Error("Staff member not found");
        }

        res.status(200).json({ 
            success: true, 
            message: "Staff details updated successfully", 
            data: updatedStaff 
        });
    } catch (error) {
        next(error);
    }
};

// 5. TERMINATE STAFF (Soft Delete)
export const deleteStaff = async (req, res, next) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            res.status(404);
            throw new Error("Staff member not found");
        }

        // Marking as LEFT to preserve transaction/ledger history
        staff.status = 'LEFT';
        await staff.save();

        res.status(200).json({ 
            success: true, 
            message: `Employee ${staff.name} status updated to LEFT.` 
        });
    } catch (error) {
        next(error);
    }
};