// expenseRoutes.js
import express from "express";
const router = express.Router();

// Controllers Import
import { 
    createExpense, 
    getAllExpenses, 
    updateExpense, 
    deleteExpense,
    getExpenseStats 
} from "../controllers/expenseController.js";

// Middlewares Import
import { protect, authorize } from "../middlewares/authMiddleware.js";

/**
 * Expense Routes - Dharashakti Agro Products
 */

// 1. List & Create: Sabhi staff kharcha dekh sakte hain, par entry 'protect' honi chahiye
router.route("/")
    .get(protect, getAllExpenses)
    .post(protect, createExpense);

// 2. Analytics: Sirf Admin aur Manager hi dekh sakein ki paisa kahan ja raha hai
router.get("/stats", protect, authorize('ADMIN', 'MANAGER'), getExpenseStats);

// 3. Update & Delete: Security ke liye sirf Admin ya Manager hi purane records badal sakein
router.route("/:id")
    .put(protect, authorize('ADMIN', 'MANAGER'), updateExpense)
    .delete(protect, authorize('ADMIN'), deleteExpense); // Delete ka haq sirf Admin ko

export default router;