// financeService.js
import Sale from "../models/Sale.js";
import Purchase from "../models/Purchase.js";
import Expense from "../models/Expense.js";
import Stock from "../models/Stock.js";
import Transaction from "../models/Transaction.js";

/**
 * Professional Finance & Reporting Service
 * Dharashakti Agro Products ERP
 */
class FinanceService {

    /**
     * @desc    Calculate Real-time Profit & Loss Statement
     * @param   {Date} startDate 
     * @param   {Date} endDate 
     */
    async getProfitLoss(startDate, endDate) {
        try {
            const query = {
                date: { $gte: new Date(startDate), $lte: new Date(endDate) }
            };

            // 1. Total Revenue (Sales)
            const salesData = await Sale.aggregate([
                { $match: { ...query, status: { $ne: 'CANCELLED' } } },
                { $group: { _id: null, totalSales: { $sum: "$subTotal" }, totalTax: { $sum: { $add: ["$cgst", "$sgst", "$igst"] } } } }
            ]);

            // 2. Total Direct Costs (Purchases)
            const purchaseData = await Purchase.aggregate([
                { $match: { purchaseDate: query.date, paymentStatus: { $ne: 'CANCELLED' } } },
                { $group: { _id: null, totalPurchase: { $sum: "$subTotal" } } }
            ]);

            // 3. Total Indirect Expenses (General Expenses + Salaries)
            const expenseData = await Expense.aggregate([
                { $match: query },
                { $group: { _id: null, totalExpense: { $sum: "$amount" } } }
            ]);

            // 4. Current Stock Valuation (Assets)
            const stockValuation = await Stock.aggregate([
                { $group: { _id: null, totalValue: { $sum: { $multiply: ["$currentQuantity", "$avgPurchasePrice"] } } } }
            ]);

            const revenue = salesData[0]?.totalSales || 0;
            const cogs = purchaseData[0]?.totalPurchase || 0;
            const expenses = expenseData[0]?.totalExpense || 0;
            const stockValue = stockValuation[0]?.totalValue || 0;

            // --- P&L Formula ---
            // Gross Profit = Revenue - Purchase Cost
            // Net Profit = (Gross Profit + Closing Stock) - Operating Expenses
            const grossProfit = revenue - cogs;
            const netProfit = (grossProfit + stockValue) - expenses;

            return {
                period: { startDate, endDate },
                revenue,
                costOfGoodsSold: cogs,
                grossProfit,
                operatingExpenses: expenses,
                closingStockValue: stockValue,
                netProfit,
                profitMargin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : 0
            };
        } catch (error) {
            console.error("Finance Service Error:", error);
            throw new Error("P&L Calculation failed: " + error.message);
        }
    }

    /**
     * @desc    Get Cash-flow Summary (Cash in Hand vs Bank)
     */
    async getCashSummary() {
        const summary = await Transaction.aggregate([
            { $group: {
                _id: "$paymentMode",
                balance: { $sum: { $subtract: ["$debit", "$credit"] } }
            }}
        ]);
        return summary;
    }
}

export default new FinanceService();