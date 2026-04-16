import financeService from "../services/financeService.js";
import Sale from "../models/Sale.js";
import Purchase from "../models/Purchase.js";
import Expense from "../models/Expense.js";
import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";

// 🔧 Helpers
const toDate = (d) => (d ? new Date(d) : null);
const isValidDate = (d) => d instanceof Date && !isNaN(d);

// ==========================================
// 1. DASHBOARD OVERVIEW (FIXED)
// ==========================================
export const getDashboardStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // ✅ Daily Sales
        const dailySales = await Sale.aggregate([
            { $match: { date: { $gte: today }, status: { $ne: "CANCELLED" } } },
            { $group: { _id: null, total: { $sum: "$grandTotal" } } }
        ]);

        // ✅ Daily Purchase
        const dailyPurchases = await Purchase.aggregate([
            { $match: { purchaseDate: { $gte: today }, status: { $ne: "CANCELLED" } } },
            { $group: { _id: null, total: { $sum: "$grandTotal" } } }
        ]);

        // 🔥 CORRECT RECEIVABLE/PAYABLE (Latest Balance per Party)
        const balances = await Transaction.aggregate([
            { $match: { partyId: { $ne: null } } },
            { $sort: { partyId: 1, date: -1, createdAt: -1 } },
            {
                $group: {
                    _id: "$partyId",
                    latestBalance: { $first: "$runningBalance" }
                }
            },
            {
                $group: {
                    _id: null,
                    receivable: {
                        $sum: {
                            $cond: [{ $gt: ["$latestBalance", 0] }, "$latestBalance", 0]
                        }
                    },
                    payable: {
                        $sum: {
                            $cond: [{ $lt: ["$latestBalance", 0] }, "$latestBalance", 0]
                        }
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                todaySales: dailySales[0]?.total || 0,
                todayPurchases: dailyPurchases[0]?.total || 0,
                netReceivable: Math.round(Math.abs(balances[0]?.receivable || 0)),
                netPayable: Math.round(Math.abs(balances[0]?.payable || 0))
            }
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 2. PROFIT & LOSS REPORT
// ==========================================
export const getProfitLossReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const start = toDate(startDate);
        const end = toDate(endDate);

        if (!isValidDate(start) || !isValidDate(end)) {
            throw new Error("Valid startDate and endDate required");
        }

        const report = await financeService.getProfitLoss(start, end);

        res.status(200).json({
            success: true,
            data: report
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 3. EXPENSE SUMMARY
// ==========================================
export const getExpenseSummary = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        let match = {};

        if (startDate && endDate) {
            const start = toDate(startDate);
            const end = toDate(endDate);

            if (!isValidDate(start) || !isValidDate(end)) {
                throw new Error("Invalid date range");
            }

            match.date = { $gte: start, $lte: end };
        }

        const summary = await Expense.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$category",
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: summary
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 4. PARTY LEDGER STATEMENT (WITH PAGINATION)
// ==========================================
export const getPartyStatement = async (req, res, next) => {
    try {
        const {
            partyId,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        if (!partyId) throw new Error("Party ID required");

        let query = { partyId };

        if (startDate && endDate) {
            const start = toDate(startDate);
            const end = toDate(endDate);

            if (!isValidDate(start) || !isValidDate(end)) {
                throw new Error("Invalid date range");
            }

            query.date = { $gte: start, $lte: end };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [transactions, total] = await Promise.all([
            Transaction.find(query)
                .sort({ date: 1, createdAt: 1 })
                .populate("performedBy", "name")
                .skip(skip)
                .limit(Number(limit))
                .lean(),

            Transaction.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            data: transactions
        });

    } catch (error) {
        next(error);
    }
};