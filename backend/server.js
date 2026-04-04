// server.js
import express from "express"; 
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import mongoose from "mongoose"; // added for direct connection check
import connectDB from "./config/db.js";

// --- Routes Imports ---
import salesRoutes from "./routes/sales.routes.js";
import employeesRoutes from "./routes/employees.routes.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import logRoutes from "./routes/log.routes.js";
import salaryRoutes from "./routes/salary.routes.js";
import stockRoutes from "./routes/stock.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import backupRoutes from "./routes/backup.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";


// Initialize Config
dotenv.config();

// ✅ MongoDB Connection (Direct Check)
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env");
  process.exit(1);
}


mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected successfully"))
.catch((err) => {
  console.error("❌ MongoDB connection failed:", err.message);
  process.exit(1);
});

// Initialize Express
const app = express();

// ✅ 1. Optimized CORS
const allowedOrigins = [
  "https://dharashakti30.vercel.app",
  "https://dharashaktionline.vercel.app",
  "https://dharashaktiv3.vercel.app",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // mobile apps or Postman

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS Not Allowed"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true
  })
);

// ✅ 2. Payload Limit
app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ✅ 3. Static Files Middleware
const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ 4. API Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/profile", profileRoutes);
 
app.use("/api/analytics", analyticsRoutes); // '/analysis' ko badal kar '/analytics' kar dein
app.use("/api/activity-logs", logRoutes); 
app.use("/api/sales", salesRoutes);
app.use("/api/purchases", purchaseRoutes); 
app.use("/api/stocks", stockRoutes); 
app.use("/api/attendance", attendanceRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/salary-payments", salaryRoutes);
app.use("/api/suppliers", supplierRoutes); 
app.use('/api/transactions', transactionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/backup", backupRoutes); 
app.use("/uploads", express.static("uploads"));


// ✅ 5. Root Route
app.get("/", (req, res) => {
  res.status(200).json({ 
    status: "Daharasakti Backend is Live ✅", 
    timestamp: new Date().toLocaleString() 
  });
});

// ✅ 6. 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ✅ 7. Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  console.error(`[${new Date().toISOString()}] Error: ${err.stack}`);
  res.status(statusCode).json({ 
    success: false, 
    message: err.message || "Internal Server Error" 
  });
});
;

// ✅ Port configuration
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally on port ${PORT}`);
  });
}


export default app;