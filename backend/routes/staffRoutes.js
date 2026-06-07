import express from "express";
const router = express.Router();

// Controllers Import (Sirf Pure Staff Management Controllers bache hain)
import { 
    createStaff, 
    getAllStaff, 
    getStaffById, 
    updateStaff, 
    deleteStaff
} from "../controllers/staffController.js";

// Middlewares Import
import { protect, authorize } from "../middlewares/authMiddleware.js";

/**
 * Staff Management Routes - Dharashakti Agro Products
 */

// 1. Core Actions: List & Create Staff Registry
// - Staff list koi bhi logged-in user dekh sakta hai.
// - Naya staff sirf Admin ya Manager hi register kar sakta hai.
router.route("/")
    .get(protect, getAllStaff)
    .post(protect, authorize('ADMIN', 'MANAGER'), createStaff);

// 2. Individual Staff Metrics: Operations using Database ID or Employee ID String
// - Details check: Koi bhi logged-in member access kar sakta hai.
// - Full updates control: Restricted to ADMIN or MANAGER.
// - Hard Termination: Strictly bound to ADMIN privileges only.
router.route("/:id")
    .get(protect, getStaffById)
    .put(protect, authorize('ADMIN', 'MANAGER'), updateStaff)
    .delete(protect, authorize('ADMIN'), deleteStaff);

export default router;