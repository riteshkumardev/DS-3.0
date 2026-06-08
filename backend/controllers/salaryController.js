import SalaryPayment from "../models/SalaryPayment.js"; 
import Staff from "../models/Staff.js";

/**
 * @desc    Get salary payment details by Bill / Voucher Number
 * @route   GET /api/salary-payments/bill/:billNo
 * @access  Private (Admin/Accountant)
 */
export const getSalaryPaymentByBill = async (req, res, next) => {
    try {
        const { billNo } = req.params;

        if (!billNo) {
            res.status(400);
            throw new Error("Bill / Voucher number is required");
        }

        // SalaryPayment database collection se unique bill structure fetch karein
        const payment = await SalaryPayment.findOne({ billNo: String(billNo).trim() });

        if (!payment) {
            res.status(404);
            throw new Error("Payment record not found for this Bill No");
        }

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all salary & advance payments for a specific employee (For Passbook & Ledger)
 * @route   GET /api/salary-payments/:employeeId
 * @access  Private (Admin/Accountant)
 */
export const getSalaryPaymentByEmployee = async (req, res, next) => {
    try {
        const { employeeId } = req.params;

        if (!employeeId) {
            res.status(400);
            throw new Error("Employee ID is required");
        }

        // Case sensitivity safe-guarding: UpperCase mapping
        const searchId = String(employeeId).trim().toUpperCase();

        // Employee ka saara running statement fetch karein (Newest First)
        const payments = await SalaryPayment.find({ employeeId: searchId }).sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Record a new advance / salary payment voucher (Confirm Payment Trigger)
 * @route   POST /api/salary-payments
 * @access  Private (Admin/Accountant)
 */
export const recordSalaryPayment = async (req, res, next) => {
    try {
        // 🚀 req.body se metadata fields aur safe params access
        const { employeeId, amount, type, date, remark, billNo, salaryMonth } = req.body;

        if (!employeeId || amount === undefined || amount === null) {
            res.status(400);
            throw new Error("Employee ID and Amount are required fields");
        }

        if (Number(amount) < 0) {
            res.status(400);
            throw new Error("Amount cannot be negative");
        }

        // 🚀 BUG FIX: String optimization & strict uppercase parsing matching structural validation rules
        const cleanEmployeeId = String(employeeId).trim().toUpperCase();

        // Verification check & Salary Fetching
        const staffExists = await Staff.findOne({ employeeId: cleanEmployeeId });
        if (!staffExists) {
            res.status(404);
            throw new Error(`Employee with ID ${cleanEmployeeId} does not exist inside Staff Master`);
        }

        // Auto-generate Bill/Voucher No agar frontend se nahi aaya
        const finalBillNo = billNo ? String(billNo).trim() : `VCH-${Date.now().toString().slice(-6)}`;

        // Unique bill restriction fallback constraint validation check
        const billDuplicateCheck = await SalaryPayment.findOne({ billNo: finalBillNo });
        if (billDuplicateCheck) {
            res.status(400);
            throw new Error(`Voucher sequence crash: A record with Bill No ${finalBillNo} already exists.`);
        }

        // 🚀 CRITICAL FIX: Fallback calculation mechanics
        const paymentDate = date || new Date().toISOString().split('T')[0];
        const finalSalaryMonth = salaryMonth || paymentDate.slice(0, 7);

        // Staff schema key fallbacks checking safety structures dynamically
        const currentSalaryRate = staffExists.baseSalary || staffExists.salary || 0;

        const payment = new SalaryPayment({
            employeeId: cleanEmployeeId,
            amount: Number(amount),
            type: type ? String(type).toUpperCase() : 'ADVANCE',
            date: paymentDate,
            remark: remark ? String(remark).trim().toUpperCase() : "RECORDED FROM PAYROLL PORTAL",
            billNo: finalBillNo,
            // 🚀 HISTORICAL SNAPSHOT FIELDS: Freeze execution logs safely
            baseSalaryAtThatTime: Number(currentSalaryRate), 
            salaryMonth: finalSalaryMonth 
        });

        const savedPayment = await payment.save();

        res.status(201).json({
            success: true,
            message: "Payment voucher recorded inside ledger successfully",
            data: savedPayment
        });
    } catch (error) {
        next(error);
    }
};