import Sale from "../models/Sale.js";
import Purchase from "../models/Purchase.js";
import Expense from "../models/Expense.js";
import Stock from "../models/Stock.js";
import Attendance from "../models/Attendance.js";


// ======================================================
// 💰 1. ADVANCED PROFIT ENGINE
// ======================================================

export const getProfitLossData = async (req, res) => {

  try {

    const [sales, purchases, expenses] = await Promise.all([

      Sale.aggregate([
        {
          $group: {
            _id: null,
            totalSales: {
              $sum: { $toDouble: { $ifNull: ["$totalPrice", "$totalAmount"] } }
            },
            orders: { $sum: 1 },
            avgSale: {
              $avg: { $toDouble: { $ifNull: ["$totalPrice", "$totalAmount"] } }
            }
          }
        }
      ]),

      Purchase.aggregate([
        {
          $group: {
            _id: null,
            totalPurchases: { $sum: { $toDouble: "$totalAmount" } }
          }
        }
      ]),

      Expense.aggregate([
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: { $toDouble: "$amount" } }
          }
        }
      ])

    ])

    const totalSales = sales[0]?.totalSales || 0
    const totalPurchases = purchases[0]?.totalPurchases || 0
    const totalExpenses = expenses[0]?.totalExpenses || 0

    const netProfit = totalSales - (totalPurchases + totalExpenses)

    const margin = totalSales > 0
      ? ((netProfit / totalSales) * 100).toFixed(2)
      : 0

    res.json({
      success: true,
      totalSales,
      totalPurchases,
      totalExpenses,
      netProfit,
      metrics: {
        margin: `${margin}%`,
        orders: sales[0]?.orders || 0,
        averageSaleValue: sales[0]?.avgSale?.toFixed(2) || 0
      }
    })

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    })

  }

}



// ======================================================
// 🤖 2. PRODUCT AI FORECAST
// ======================================================

export const getProductForecast = async (req, res) => {

  try {

    const sales = await Sale.aggregate([

      {
        $group: {
          _id: "$productName",
          totalSold: { $sum: { $toDouble: "$quantity" } },
          revenue: {
            $sum: { $toDouble: { $ifNull: ["$totalPrice", "$totalAmount"] } }
          },
          firstSale: { $min: "$createdAt" },
          lastSale: { $max: "$createdAt" }
        }
      }

    ])

    const stocks = await Stock.find({})

    const forecast = sales.map((product) => {

      const stock = stocks.find(s => s.productName === product._id)

      const currentStock = stock?.totalQuantity || 0

      const daysActive =
        Math.max(
          1,
          (new Date(product.lastSale) - new Date(product.firstSale))
          / (1000 * 60 * 60 * 24)
        )

      const dailyDemand = product.totalSold / daysActive

      const forecast30 = Math.round(dailyDemand * 30)
      const forecast60 = Math.round(dailyDemand * 60)
      const forecast90 = Math.round(dailyDemand * 90)

      const stockOutDays =
        dailyDemand > 0
          ? Math.round(currentStock / dailyDemand)
          : 999

      const reorder =
        forecast30 > currentStock
          ? forecast30 - currentStock + 100
          : 0

      return {

        product: product._id,

        currentStock,

        totalSold: product.totalSold,

        revenue: product.revenue,

        dailyDemand: dailyDemand.toFixed(2),

        forecast30Days: forecast30,

        forecast60Days: forecast60,

        forecast90Days: forecast90,

        stockOutDays,

        reorderSuggestion: reorder,

        health:
          stockOutDays < 10
            ? "Critical"
            : stockOutDays < 30
            ? "Warning"
            : "Healthy"

      }

    })

    res.json({
      success: true,
      forecast
    })

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    })

  }

}



// ======================================================
// 👨‍🏭 3. EMPLOYEE EFFICIENCY ENGINE
// ======================================================

export const getEmployeeEfficiency = async (req, res) => {

  try {

    const employees = await Attendance.aggregate([

      {
        $group: {
          _id: "$employeeId",
          name: { $first: "$name" },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      },

      {
        $project: {
          name: 1,
          efficiency: {
            $multiply: [
              { $divide: ["$present", "$total"] },
              100
            ]
          }
        }
      },

      { $sort: { efficiency: -1 } },

      { $limit: 10 }

    ])

    res.json({
      success: true,
      employees
    })

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    })

  }

}



// ======================================================
// 📈 4. MONTHLY TREND ENGINE
// ======================================================
export const getMonthlyGrowthTrend = async (req, res) => {
  try {
    const trend = await Sale.aggregate([
      {
        $group: {
          _id: {
            // convert string to date safely before extracting month/year
            month: { $month: { $toDate: "$createdAt" } }, 
            year: { $year: { $toDate: "$createdAt" } }
          },
          revenue: {
            $sum: { $toDouble: { $ifNull: ["$totalPrice", "$totalAmount", 0] } }
          },
          orders: { $sum: 1 }
        }
      },
      { 
        $sort: { "_id.year": -1, "_id.month": -1 } 
      },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      trend: trend || [] // hamesha array bhejein
    });

  } catch (error) {
    console.error("Aggregation Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Data formatting error: Check if 'createdAt' is a valid date string",
      error: error.message
    });
  }
};


// ======================================================
// 🧠 5. BUSINESS AI INSIGHTS
// ======================================================

export const getBusinessInsights = async (req, res) => {

  try {

    const sales = await Sale.find({})
    const purchases = await Purchase.find({})
    const expenses = await Expense.find({})

    const totalSales =
      sales.reduce((a, b) => a + Number(b.totalPrice || b.totalAmount || 0), 0)

    const totalPurchases =
      purchases.reduce((a, b) => a + Number(b.totalAmount || 0), 0)

    const totalExpenses =
      expenses.reduce((a, b) => a + Number(b.amount || 0), 0)

    const netProfit =
      totalSales - (totalPurchases + totalExpenses)

    const insights = []

    if (netProfit > 0)
      insights.push("Business profitable — expansion possible")

    if (netProfit < 0)
      insights.push("Loss detected — reduce expenses")

    if (totalExpenses > totalSales * 0.4)
      insights.push("Expenses too high — optimize operations")

    if (totalSales > 1000000)
      insights.push("High sales — scale production")

    res.json({

      success: true,

      insights,

      summary: {

        totalSales,
        totalPurchases,
        totalExpenses,
        netProfit

      }

    })

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    })

  }

}