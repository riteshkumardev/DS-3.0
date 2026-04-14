import express from "express";
import { 
  markAttendance, 
  markBulkAttendance, 
  getAllAttendance,      // 👈 Naya function import karein
  getDailyAttendance, 
  getEmployeeMonthlyReport 
} from "../controllers/attendance.controller.js";

const router = express.Router();

// 1️⃣ Sabhi Attendance Records lene ke liye (Fixes Working Days 0)
// React ab is route se pura data fetch karke Work Days calculate karega
router.get("/", getAllAttendance); 

// 2️⃣ Single Attendance Mark karne ke liye
router.post("/", markAttendance);

// 3️⃣ Bulk/Back-date Attendance Mark karne ke liye
router.post("/bulk", markBulkAttendance);

// 4️⃣ Particular date ki attendance dekhne ke liye (e.g. /api/attendance/2026-02-08)
router.get("/day/:date", getDailyAttendance); // 💡 Tip: Isko /day/:date kar dena behtar hai taaki conflict na ho

// 5️⃣ Employee ledger/monthly report ke liye
router.get("/report/:empId", getEmployeeMonthlyReport);

export default router;