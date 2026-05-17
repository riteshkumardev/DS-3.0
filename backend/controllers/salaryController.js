import SalaryPayment from "../models/SalaryPayment.js"; // 🚀 CRITICAL FIX: Reference Error solved here
import Staff from "../models/Staff.js";

/**
 * @desc    Get salary payment details by Bill / Voucher Number
 * @route   GET /api/salary-payments/bill/:billNo
 * @access  Private (Admin/Accountant)
 */
export const getSalaryPaymentByBill = async (req, res, next) => {
    try {
        const { billNo } = req.params;

        // SalaryPayment database collection se unique bill structure fetch karein
        const payment = await SalaryPayment.findOne({ billNo: billNo });

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

        // Employee ka saara running statement fetch karein (Newest First)
        const payments = await SalaryPayment.find({ employeeId }).sort({ date: -1 });

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
        const { employeeId, amount, type, date, remark, billNo } = req.body;

        if (!employeeId || !amount) {
            res.status(400);
            throw new Error("Employee ID and Amount are required fields");
        }

        // Verification check: Kya employee Staff Master mein mapped hai?
        const staffExists = await Staff.findOne({ employeeId });
        if (!staffExists) {
            res.status(404);
            throw new Error(`Employee with ID ${employeeId} does not exist inside Staff Master`);
        }

        // Auto-generate Bill/Voucher No agar frontend se nahi aaya
        const finalBillNo = billNo || `VCH-${Date.now().toString().slice(-6)}`;

        const payment = new SalaryPayment({
            employeeId,
            amount,
            type: type || 'ADVANCE',
            date: date || new Date().toISOString().split('T')[0],
            remark: remark || "RECORDED FROM PAYROLL PORTAL",
            billNo: finalBillNo
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