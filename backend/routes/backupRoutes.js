import express from "express";
import { 
    generateBackup, 
    restoreBackup, 
    exportToExcel 
} from "../controllers/backupController.js";
import { protect, admin } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/backup/download
 * @desc    Generate Full System JSON Backup (For Data Restore)
 * @access  Private/Admin
 */
router.get("/download", protect, admin, generateBackup);

/**
 * @route   GET /api/backup/excel
 * @desc    Export Full Inventory & Sales to Excel (For Analysis)
 * @access  Private/Admin
 */
router.get("/excel", protect, admin, exportToExcel);

/**
 * @route   POST /api/backup/restore
 * @desc    Restore System Data from JSON file
 * @access  Private/Admin
 */
router.post("/restore", protect, admin, restoreBackup);

export default router;