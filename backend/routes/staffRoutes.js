// staffRoutes.js
import express from "express";
const router = express.Router();

// Controllers Import
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

// 1. List & Create: Staff list koi bhi logged-in user dekh sakta hai
// Naya staff sirf Admin ya Manager hi add kar sakta hai
router.route("/")
    .get(protect, getAllStaff)
    .post(protect, authorize('ADMIN', 'MANAGER'), createStaff);

// 2. Individual Staff Details & Updates
router.route("/:id")
    .get(protect, getStaffById)
    .put(protect, authorize('ADMIN', 'MANAGER'), updateStaff)
    .delete(protect, authorize('ADMIN'), deleteStaff); // Termination sirf Admin handle karega

export default router;