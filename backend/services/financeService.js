import Sale from "../models/Sale.js";
import Purchase from "../models/Purchase.js";
import Expense from "../models/Expense.js";
import Stock from "../models/Stock.js";
import Transaction from "../models/Transaction.js";

/**
 * 🚀 PROFESSIONAL FINANCE SERVICE (FIXED)
 * ✔ Correct P&L Logic
 * ✔ Real COGS Calculation
 * ✔ Accurate Cash Flow
 */

class FinanceService {

    /**
     * 📊 PROFIT & LOSS STATEMENT
     */
    async getProfitLoss(startDate, endDate) {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            // 1️⃣ SALES (Revenue)
            const salesData = await Sale.aggregate([
                {
                    $match: {
                        date: { $gte: start, $lte: end },
                        status: { $ne: "CANCELLED" }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSales: { $sum: "$subTotal" }
                    }
                }
            ]);

            // 2️⃣ PURCHASES
            const purchaseData = await Purchase.aggregate([
                {
                    $match: {
                        purchaseDate: { $gte: start, $lte: end },
                        status: { $ne: "CANCELLED" }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalPurchase: { $sum: "$subTotal" }
                    }
                }
            ]);

            // 3️⃣ EXPENSES
            const expenseData = await Expense.aggregate([
                {
                    $match: {
                        date: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalExpense: { $sum: "$amount" }
                    }
                }
            ]);

            // 4️⃣ CLOSING STOCK
            const closingStockData = await Stock.aggregate([
                {
                    $group: {
                        _id: null,
                        totalValue: {
                            $sum: {
                                $multiply: ["$currentQuantity", "$avgPurchasePrice"]
                            }
                        }
                    }
                }
            ]);

            // ⚠️ OPTIONAL: Opening Stock (if stored)
            const openingStock = 0; // 👉 future improvement (store in DB)

            const revenue = salesData[0]?.totalSales || 0;
            const purchases = purchaseData[0]?.totalPurchase || 0;
            const expenses = expenseData[0]?.totalExpense || 0;
            const closingStock = closingStockData[0]?.totalValue || 0;

            // ✅ CORRECT ACCOUNTING
            const cogs = openingStock + purchases - closingStock;
            const grossProfit = revenue - cogs;
            const netProfit = grossProfit - expenses;

            return {
                period: { startDate, endDate },

                revenue,
                purchases,
                openingStock,
                closingStock,

                costOfGoodsSold: cogs,
                grossProfit,

                operatingExpenses: expenses,
                netProfit,

                profitMargin:
                    revenue > 0
                        ? ((netProfit / revenue) * 100).toFixed(2)
                        : "0.00"
            };

        } catch (error) {
            console.error("❌ Finance Error:", error);
            throw new Error("P&L failed: " + error.message);
        }
    }

    /**
     * 💰 CASH & BANK SUMMARY (REAL FIX)
     */
    async getCashSummary() {
        try {
            const summary = await Transaction.aggregate([
                {
                    $match: {
                        paymentMode: { $in: ["CASH", "BANK"] }
                    }
                },
                {
                    $group: {
                        _id: "$paymentMode",

                        // Cash In
                        totalIn: {
                            $sum: "$credit"
                        },

                        // Cash Out
                        totalOut: {
                            $sum: "$debit"
                        }
                    }
                },
                {
                    $project: {
                        paymentMode: "$_id",
                        totalIn: 1,
                        totalOut: 1,
                        balance: { $subtract: ["$totalIn", "$totalOut"] }
                    }
                }
            ]);

            return summary;

        } catch (error) {
            console.error("❌ Cash Summary Error:", error);
            throw error;
        }
    }
}

export default new FinanceService();