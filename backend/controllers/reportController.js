// reportController.js
import financeService from "../services/financeService.js";
import Sale from "../models/Sale.js";
import Purchase from "../models/Purchase.js";
import Expense from "../models/Expense.js";
import Transaction from "../models/Transaction.js";

/**
 * Professional Report Controller (Data Aggregation & Filters)
 * Dharashakti Agro Products ERP
 */

// 1. DASHBOARD OVERVIEW (Real-time Numbers)
export const getDashboardStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // A. Aaj ki Sales aur Purchases
        const dailySales = await Sale.aggregate([
            { $match: { date: { $gte: today }, status: { $ne: 'CANCELLED' } } },
            { $group: { _id: null, total: { $sum: "$grandTotal" } } }
        ]);

        const dailyPurchases = await Purchase.aggregate([
            { $match: { purchaseDate: { $gte: today } } },
            { $group: { _id: null, total: { $sum: "$grandTotal" } } }
        ]);

        // B. Total Receivables & Payables (Ledger Balance)
        const balances = await Transaction.aggregate([
            { $group: { 
                _id: null, 
                receivable: { $sum: { $cond: [{ $gt: ["$runningBalance", 0] }, "$runningBalance", 0] } },
                payable: { $sum: { $cond: [{ $lt: ["$runningBalance", 0] }, "$runningBalance", 0] } }
            }}
        ]);

        res.status(200).json({
            success: true,
            data: {
                todaySales: dailySales[0]?.total || 0,
                todayPurchases: dailyPurchases[0]?.total || 0,
                netReceivable: Math.abs(balances[0]?.receivable || 0),
                netPayable: Math.abs(balances[0]?.payable || 0)
            }
        });
    } catch (error) {
        next(error);
    }
};

// 2. PROFIT & LOSS REPORT (Date Range Filter)
export const getProfitLossReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            res.status(400);
            throw new Error("Please provide start and end dates");
        }

        const report = await financeService.getProfitLoss(startDate, endDate);
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        next(error);
    }
};

// 3. EXPENSE SUMMARY (Category-wise)
export const getExpenseSummary = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const query = {
            date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        };

        const summary = await Expense.aggregate([
            { $match: query },
            { $group: { _id: "$category", totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } },
            { $sort: { totalAmount: -1 } }
        ]);

        res.status(200).json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
};

// 4. PARTY LEDGER STATEMENT (Detailed Transaction History)
export const getPartyStatement = async (req, res, next) => {
    try {
        const { partyId, startDate, endDate } = req.query;
        const query = { partyId };

        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const transactions = await Transaction.find(query)
            .sort({ date: 1, createdAt: 1 })
            .populate('performedBy', 'name');

        res.status(200).json({ success: true, count: transactions.length, data: transactions });
    } catch (error) {
        next(error);
    }
};