import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";

import connectDB from "./config/db.js";

// --- Middlewares ---
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";
import activityLogger from "./middlewares/logMiddleware.js";
import logger from "./utils/logger.js";

// --- Routes ---
import authRoutes from "./routes/authRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import ledgerRoutes from "./routes/ledgerRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import partyRoutes from "./routes/partyRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import backupRoutes from "./routes/backupRoutes.js";
import salaryPaymentRoutes from "./routes/salaryPaymentRoutes.js"; // File path sahi check kar lein

// ===============================
// 🔹 CONFIG
// ===============================
dotenv.config();

// ===============================
// 🔹 DB CONNECT
// ===============================
connectDB();

// ===============================
const app = express();

// ===============================
// 🔹 SECURITY MIDDLEWARES
// ===============================
app.use(helmet()); // Secure headers
app.use(compression()); // Response compression

// ===============================
// 🔹 LOGGER (DEV ONLY)
// ===============================
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ===============================
// 🔹 CORS CONFIG (SMART)
// ===============================
const allowedOrigins = [
  "https://dharashakti30.vercel.app",
  "https://dharashaktionline.vercel.app",
  "https://dharashaktiv3.vercel.app",
  "http://localhost:3000"
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow mobile apps / postman (no origin)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`❌ CORS Blocked: ${origin}`);
      callback(new Error("CORS Not Allowed"));
    }
  },
  credentials: true
}));

// ===============================
// 🔹 BODY PARSER
// ===============================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ===============================
// 🔹 STATIC FILES (UPLOADS)
// ===============================
const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===============================
// 🔹 ACTIVITY LOGGER (AUTO LOG)
// ===============================
app.use(activityLogger);

// ===============================
// 🔹 ROUTES
// ===============================
// 👇 YEH LINE ADD KAREIN
app.use("/api/salary-payments", salaryPaymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/employees", staffRoutes); // alias
app.use("/api/stocks", stockRoutes);
app.use("/api/parties", partyRoutes);
app.use("/api/products", productRoutes);
app.use("/api/attendance", attendanceRoutes);


// ... baki middlewares
app.use("/api/backup", backupRoutes);

// ===============================
// 🔹 HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Dharashakti ERP Backend Running",
    environment: process.env.NODE_ENV,
    time: new Date().toISOString()
  });
});

// ===============================
// 🔹 ERROR HANDLING
// ===============================
app.use(notFound);
app.use(errorHandler);

// ===============================
// 🔹 UNHANDLED ERRORS (CRASH SAFE)
// ===============================
process.on("unhandledRejection", (err) => {
  logger.error(`❌ Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error(`❌ Uncaught Exception: ${err.message}`);
  process.exit(1);
});

// ===============================
// 🔹 SERVER START
// ===============================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  console.log(`🚀 Server running on port ${PORT}`);
});

// ===============================
// 🔹 GRACEFUL SHUTDOWN
// ===============================
process.on("SIGTERM", () => {
  logger.info("🛑 SIGTERM received. Shutting down...");
  server.close(() => {
    logger.info("💀 Process terminated");
  });
});

export default app;