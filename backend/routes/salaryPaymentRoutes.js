import express from "express";
const router = express.Router();

// Controllers Import (Sahi path aur updated functions ke saath)
import { 
    getSalaryPaymentByBill, 
    getSalaryPaymentByEmployee, 
    recordSalaryPayment 
} from "../controllers/salaryController.js";

// Middlewares Import (RBAC Configuration)
import { protect, authorize } from "../middlewares/authMiddleware.js";

/**
 * Salary Payment & Ledger Routes - Dharashakti ERP
 */

// 1. Record a new advance / salary payment voucher (Confirm Payment Tracker)
// POST: http://localhost:5000/api/salary-payments
router.post(
    "/", 
    protect, 
    authorize('ADMIN', 'ACCOUNTANT'), 
    recordSalaryPayment
);

// 2. Get salary payment details by Bill/Voucher Number
// GET: http://localhost:5000/api/salary-payments/bill/VCH-123456
router.get(
    "/bill/:billNo", 
    protect, 
    authorize('ADMIN', 'ACCOUNTANT'), 
    getSalaryPaymentByBill
);

// 3. Get all salary & advance payments for a specific employee (For Passbook & Ledger)
// GET: http://localhost:5000/api/salary-payments/DS-2026-001
router.get(
    "/:employeeId", 
    protect, 
    authorize('ADMIN', 'ACCOUNTANT'), 
    getSalaryPaymentByEmployee
);

export default router;