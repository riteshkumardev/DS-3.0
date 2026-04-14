import express from "express";

import {
  getProfitLossData,
  getProductForecast,
  getEmployeeEfficiency,
  getMonthlyGrowthTrend,
  getBusinessInsights
} from "../controllers/analytics.controller.js";

const router = express.Router();


// 💰 Profit & Loss
router.get("/profit-loss", getProfitLossData);


// 📦 Product AI Forecast
router.get("/product-forecast", getProductForecast);


// 👨‍🏭 Employee Efficiency
router.get("/employee-efficiency", getEmployeeEfficiency);


// 📈 Sales Trend
router.get("/trends", getMonthlyGrowthTrend);


// 🧠 Business Insights
router.get("/insights", getBusinessInsights);


export default router;