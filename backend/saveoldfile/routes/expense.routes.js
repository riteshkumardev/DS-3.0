import express from "express";
import { 
    addExpense, 
    getExpenses, 
    updateExpense, 
    deleteExpense 
} from "../controllers/expense.controller.js";

const router = express.Router();

// 📄 Get all Expenses
router.get("/", getExpenses);

// ➕ Add New Expense
router.post("/", addExpense); 

// ✏️ Update Existing Expense (New)
// We use :id to identify which expense to update
router.put("/:id", updateExpense); 

// 🗑️ Delete Expense (New)
router.delete("/:id", deleteExpense);

export default router;