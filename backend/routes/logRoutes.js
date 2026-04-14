// logRoutes.js
import express from "express";
const router = express.Router();

// Controllers Import
import { 
    getAllLogs, 
    getDocumentHistory, 
    clearOldLogs 
} from "../controllers/logController.js";

// Middlewares Import
import { protect, authorize } from "../middlewares/authMiddleware.js";

/**
 * Audit Log Routes - Dharashakti Agro Products
 * Monitoring & System Transparency
 */

// 1. View Activity Logs: Sirf Admin ya Manager hi monitor kar sakte hain
// Query params: ?user=ID&module=SALE&startDate=...
router.get("/", protect, authorize('ADMIN', 'MANAGER'), getAllLogs);

// 2. Specific Document History: Kisi bhi Bill ya Transaction ki poori history dekhna
router.get("/history/:docId", protect, authorize('ADMIN', 'MANAGER'), getDocumentHistory);

// 3. Maintenance: Purane logs clear karna (Sirf Admin)
router.delete("/clear-history", protect, authorize('ADMIN'), clearOldLogs);

export default router;