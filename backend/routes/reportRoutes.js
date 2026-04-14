// reportRoutes.js
import express from "express";
const router = express.Router();

// Controllers Import
import { 
    getDashboardStats, 
    getProfitLossReport, 
    getExpenseSummary, 
    getPartyStatement 
} from "../controllers/reportController.js";

// Middlewares Import
import { protect, authorize } from "../middlewares/authMiddleware.js";

/**
 * Report & Analytics Routes - Dharashakti Agro Products
 */

// 1. Dashboard Overview: Aaj ki sale, purchase aur total balance status
router.get("/dashboard-stats", protect, getDashboardStats);

// 2. Profit & Loss: Sirf Admin aur Manager ke liye (Highly Sensitive)
// Query params: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get("/profit-loss", protect, authorize('ADMIN', 'MANAGER'), getProfitLossReport);

// 3. Expense Analysis: Category-wise kharcha dekhna (FUEL, LOADING, etc.)
router.get("/expense-summary", protect, authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), getExpenseSummary);

// 4. Party Ledger: Kisi bhi party ka complete statement nikaalna
// Query params: ?partyId=ID&startDate=...&endDate=...
router.get("/party-statement", protect, getPartyStatement);

export default router;