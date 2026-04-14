// ledgerRoutes.js
import express from "express";
const router = express.Router();

// Controllers Import (Inhe humne reportController aur transactionController mein define kiya hai)
import { 
    getPartyStatement, 
    getDashboardStats 
} from "../controllers/reportController.js";

// Transaction CRUD (Payments/Receipts ke liye)
import { 
    createTransaction, 
    getAllTransactions,
    deleteTransaction 
} from "../controllers/transactionController.js";

// Middlewares Import
import { protect, authorize } from "../middlewares/authMiddleware.js";

/**
 * Ledger & Transaction Routes - Dharashakti Agro Products
 */

// 1. Transactions (Payment In/Out)
// Staff entries kar sakta hai, lekin Admin/Manager hi delete kar sakta hai
router.route("/transactions")
    .get(protect, getAllTransactions)
    .post(protect, createTransaction);

router.delete("/transactions/:id", protect, authorize('ADMIN'), deleteTransaction);

// 2. Party Statements (Detailed Ledger View)
// Frontend call: /api/ledger/statement?partyId=XXXX&startDate=YYYY&endDate=ZZZZ
router.get("/statement", protect, getPartyStatement);

// 3. Financial Summary (Dashboard ke liye)
router.get("/summary", protect, authorize('ADMIN', 'MANAGER', 'ACCOUNTANT'), getDashboardStats);

export default router;