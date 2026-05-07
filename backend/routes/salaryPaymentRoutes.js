import express from "express";
const router = express.Router();

// Controller aur Middleware ke paths aur .js extension verify karein
import { getSalaryPaymentByBill } from "../controllers/salaryController.js";
import { protect } from "../middlewares/authMiddleware.js"; // 'middlewares' with S as per your server.js

// GET request for: /api/salary-payments/DS-2026-001
router.get("/:billNo", protect, getSalaryPaymentByBill);

export default router;