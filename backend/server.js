import express from "express"; 
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import connectDB from "./config/db.js";

// --- Middlewares Imports ---
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";
import activityLogger from "./middlewares/logMiddleware.js";
import logger from "./utils/logger.js";

// --- Routes Imports (Matching your new Screenshot) ---
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
// Initialize Config
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// ✅ 1. Optimized CORS
const allowedOrigins = [
  "https://dharashakti30.vercel.app",
  "https://dharashaktionline.vercel.app",
  "https://dharashaktiv3.vercel.app",
  "http://localhost:3000"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS Not Allowed"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));

// ✅ 2. Standard Payload Limit
app.use(express.json({ limit: "10mb" })); 
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ✅ 3. Activity Logger Middleware (Automatic Audit Logs)
app.use(activityLogger);

// ✅ 4. API Routes (Mapping with your New Files)
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/employees", staffRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/parties", partyRoutes);
app.use("/api/products", productRoutes);
app.use("/api/attendance", attendanceRoutes);
// Static Files Folder
const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ 5. Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({ 
    status: "Dhara Shakti ERP Backend is Live ✅", 
    timestamp: new Date().toLocaleString() 
  });
});

// ✅ 6. Error Handling Middlewares (Crash hone se bachane ke liye)
app.use(notFound);      // 404 Handler
app.use(errorHandler);  // Global Error Handler

// ✅ Port configuration
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;