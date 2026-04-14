import express from "express";
import { 
    markBulkAttendance, 
    getDailyAttendance, 
    getMonthlyReport 
} from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/bulk", markBulkAttendance);
router.get("/daily", getDailyAttendance);
router.get("/report/:staffId", getMonthlyReport);

export default router;