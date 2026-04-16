// expenseController.js
import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import Transaction from "../models/Transaction.js";
import logService from "../services/logService.js";
import { EXPENSE_CATEGORIES, PAYMENT_MODES } from "../utils/constants.js";

// 🔧 Helper
const normalize = (val) => (val ? val.toUpperCase().trim() : val);

// ==========================================
// 1. CREATE EXPENSE (WITH LEDGER ENTRY)
// ==========================================
export const createExpense = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let { title, category, amount, date, paymentMode = "CASH", remarks } = req.body;

        if (!title || !amount) throw new Error("Title and amount required");

        category = normalize(category);
        paymentMode = normalize(paymentMode);

        // ✅ Validation
        if (!EXPENSE_CATEGORIES.includes(category)) {
            throw new Error(`Invalid category`);
        }

        if (!PAYMENT_MODES.includes(paymentMode)) {
            throw new Error(`Invalid payment mode`);
        }

        const expense = await Expense.create([{
            title: normalize(title),
            category,
            amount,
            date: date || new Date(),
            paymentMode,
            remarks,
            performedBy: req.user?._id
        }], { session });

        // ✅ Ledger Entry (VERY IMPORTANT)
        await Transaction.create([{
            type: "CREDIT", // paisa gaya
            amount,
            source: "EXPENSE",
            referenceId: expense[0]._id,
            date: expense[0].date,
            description: `${category} Expense`,
            performedBy: req.user?._id,
        }], { session });

        await session.commitTransaction();
        session.endSession();

        // ✅ Audit log
        await logService.createLog({
            performedBy: req.user?._id,
            action: "CREATE",
            module: "EXPENSE",
            documentId: expense[0]._id,
            newValue: expense[0],
            remark: `Expense created - ${title}`,
            req,
        });

        res.status(201).json({
            success: true,
            data: expense[0],
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

// ==========================================
// 2. GET ALL EXPENSES (FAST + AGGREGATE)
// ==========================================
export const getAllExpenses = async (req, res, next) => {
    try {
        const { startDate, endDate, category, paymentMode, search } = req.query;

        let match = {};

        // ✅ Date filter flexible
        if (startDate || endDate) {
            match.date = {};
            if (startDate) match.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                match.date.$lte = end;
            }
        }

        if (category && category !== "ALL") {
            match.category = normalize(category);
        }

        if (paymentMode) {
            match.paymentMode = normalize(paymentMode);
        }

        if (search) {
            match.$or = [
                { title: { $regex: search, $options: "i" } },
                { remarks: { $regex: search, $options: "i" } }
            ];
        }

        const expenses = await Expense.find(match)
            .sort({ date: -1, createdAt: -1 })
            .populate("performedBy", "name")
            .lean();

        // ✅ FAST total (aggregation)
        const totalAgg = await Expense.aggregate([
            { $match: match },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        res.status(200).json({
            success: true,
            count: expenses.length,
            totalAmount: totalAgg[0]?.total || 0,
            data: expenses
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 3. UPDATE EXPENSE (WITH AUDIT)
// ==========================================
export const updateExpense = async (req, res, next) => {
    try {
        const expenseId = req.params.id;

        const oldExpense = await Expense.findById(expenseId).lean();
        if (!oldExpense) throw new Error("Expense not found");

        if (req.body.title) req.body.title = normalize(req.body.title);

        const updated = await Expense.findByIdAndUpdate(
            expenseId,
            { $set: req.body, performedBy: req.user?._id },
            { new: true, runValidators: true }
        );

        await logService.createLog({
            performedBy: req.user?._id,
            action: "UPDATE",
            module: "EXPENSE",
            documentId: updated._id,
            oldValue: oldExpense,
            newValue: updated,
            remark: `Expense updated`,
            req,
        });

        res.status(200).json({
            success: true,
            message: "Expense updated",
            data: updated
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 4. DELETE EXPENSE (SOFT DELETE)
// ==========================================
export const deleteExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) throw new Error("Expense not found");

        // ❗ Soft delete
        expense.isActive = false;
        await expense.save();

        await logService.logDeletion(
            req.user?._id,
            "EXPENSE",
            expense._id,
            expense,
            req
        );

        res.status(200).json({
            success: true,
            message: "Expense deactivated"
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 5. EXPENSE STATS (ADVANCED)
// ==========================================
export const getExpenseStats = async (req, res, next) => {
    try {
        const stats = await Expense.aggregate([
            {
                $group: {
                    _id: "$category",
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        next(error);
    }
};