import express from "express";
const router = express.Router();

// Controllers Import (Sahi path aur extension ke saath)
import { getSalaryPaymentByBill } from "../controllers/salaryController.js";

// Middlewares Import (Aapke auth routes ke style mein)
import { protect, authorize } from "../middlewares/authMiddleware.js";

/**
 * Salary Payment Routes - Dharashakti ERP
 */

// Sirf Admin aur Accountant hi salary records dekh sakte hain
router.get("/:billNo", protect, authorize('ADMIN', 'ACCOUNTANT'), getSalaryPaymentByBill);

export default router;