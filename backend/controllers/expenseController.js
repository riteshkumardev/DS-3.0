// expenseController.js
import Expense from "../models/Expense.js";
import { EXPENSE_CATEGORIES, PAYMENT_MODES } from "../utils/constants.js";
import mongoose from "mongoose";

/**
 * Professional Expense Controller (Daily Kharcha Management)
 * Dharashakti Agro Products ERP
 */

// 1. CREATE EXPENSE
export const createExpense = async (req, res, next) => {
    try {
        const { title, category, amount, date, paymentMode, remarks } = req.body;

        // Validation: Category check
        if (!EXPENSE_CATEGORIES.includes(category)) {
            res.status(400);
            throw new Error(`Invalid category. Must be one of: ${EXPENSE_CATEGORIES.join(", ")}`);
        }

        const expense = new Expense({
            title: title.toUpperCase(),
            category,
            amount,
            date: date || new Date(),
            paymentMode: paymentMode || 'CASH',
            remarks,
            performedBy: req.user._id
        });

        const savedExpense = await expense.save();
        res.status(201).json({ success: true, data: savedExpense });
    } catch (error) {
        next(error);
    }
};

// 2. GET ALL EXPENSES (With Multi-Filters)
export const getAllExpenses = async (req, res, next) => {
    try {
        const { startDate, endDate, category, paymentMode, search } = req.query;
        let query = {};

        // Filter: Date Range
        if (startDate && endDate) {
            query.date = { 
                $gte: new Date(startDate), 
                $lte: new Date(endDate) 
            };
        }

        // Filter: Category (e.g., FUEL, LOADING)
        if (category && category !== 'ALL') {
            query.category = category;
        }

        // Filter: Payment Mode (CASH/BANK)
        if (paymentMode) {
            query.paymentMode = paymentMode;
        }

        // Filter: Search in Title or Remarks
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { remarks: { $regex: search, $options: 'i' } }
            ];
        }

        const expenses = await Expense.find(query)
            .sort({ date: -1, createdAt: -1 })
            .populate('performedBy', 'name');

        // Total Amount Calculation for the filtered result
        const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        res.status(200).json({ 
            success: true, 
            count: expenses.length, 
            totalAmount,
            data: expenses 
        });
    } catch (error) {
        next(error);
    }
};

// 3. UPDATE EXPENSE
export const updateExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findByIdAndUpdate(
            req.params.id,
            { ...req.body, title: req.body.title?.toUpperCase() },
            { new: true, runValidators: true }
        );

        if (!expense) {
            res.status(404);
            throw new Error("Expense record not found");
        }

        res.status(200).json({ success: true, message: "Expense updated", data: expense });
    } catch (error) {
        next(error);
    }
};

// 4. DELETE EXPENSE
export const deleteExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        if (!expense) {
            res.status(404);
            throw new Error("Expense not found");
        }
        res.status(200).json({ success: true, message: "Expense deleted successfully" });
    } catch (error) {
        next(error);
    }
};

// 5. GET EXPENSE STATS (For Analytics Chart)
export const getExpenseStats = async (req, res, next) => {
    try {
        const stats = await Expense.aggregate([
            { $group: { _id: "$category", total: { $sum: "$amount" } } },
            { $sort: { total: -1 } }
        ]);
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};