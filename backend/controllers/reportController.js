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
// 1. DASHBOARD OVERVIEW (NO CHANGE)
// ==========================================
export const getDashboardStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dailySales = await Sale.aggregate([
            { $match: { date: { $gte: today }, status: { $ne: "CANCELLED" } } },
            { $group: { _id: null, total: { $sum: "$grandTotal" } } }
        ]);

        const dailyPurchases = await Purchase.aggregate([
            { $match: { purchaseDate: { $gte: today }, status: { $ne: "CANCELLED" } } },
            { $group: { _id: null, total: { $sum: "$grandTotal" } } }
        ]);

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
// 2. PROFIT & LOSS REPORT (NO CHANGE)
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
// 3. EXPENSE SUMMARY (NO CHANGE)
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
// 4. PARTY LEDGER STATEMENT (FULL FIXED)
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

        // ✅ FETCH TRANSACTIONS
        const transactions = await Transaction.find(query)
            .sort({ date: 1, createdAt: 1 })
            .populate("performedBy", "name")
            .lean();

  // 🔥 OPTIMIZED & SAFE VERSION
const formatted = await Promise.all(
    transactions.map(async (txn) => {
        let goods = [];
        let billNo = "-";

        // ✅ SAFE TYPE (future-proof)
        const txnType = txn.type || txn.referenceType;

        // ❗ अगर referenceId ही नहीं है तो skip
        if (!txn.referenceId) {
            return {
                ...txn,
                billNo,
                goods
            };
        }

        try {
            // ✅ SALE
            if (txnType === "SALE") {
                const sale = await Sale.findById(txn.referenceId)
                    .select("billNo goods")
                    .lean();

                if (sale) {
                    goods = sale.goods || [];
                    billNo = sale.billNo || "-";
                }
            }

            // ✅ PURCHASE
            else if (txnType === "PURCHASE") {
                const purchase = await Purchase.findById(txn.referenceId)
                    .select("billNo goods")
                    .lean();

                if (purchase) {
                    goods = purchase.goods || [];
                    billNo = purchase.billNo || "-";
                }
            }

        } catch (err) {
            console.error("❌ Mapping Error:", err.message);
        }

        return {
            ...txn,
            billNo,
            goods
        };
    })
);

        // ✅ PAGINATION
        const total = formatted.length;
        const paginated = formatted.slice(skip, skip + Number(limit));

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            data: paginated
        });

    } catch (error) {
        next(error);
    }
};