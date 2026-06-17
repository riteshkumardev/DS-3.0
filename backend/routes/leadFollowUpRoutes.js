import express from "express";
// 🚀 BUG FIX: Saare updated controller methods ko ek sath cleanly import kiya
import { 
    createFollowUp, 
    getActiveFollowUps,
    getLeadsByRouteLocation,
    updateLeadStatus
} from "../controllers/leadController.js"; 

const router = express.Router();

/**
 * @route   POST /api/leads/follow-ups
 * @desc    Record/Create a new lead order or follow-up action item
 * @access  Private (Admin/Accountant/Salesman)
 */
router.post("/follow-ups", createFollowUp);

/**
 * @route   GET /api/leads/active
 * @desc    Get all active, pending and overdue follow-ups for Dashboard Alerts
 * @access  Private (Admin/Accountant/Salesman)
 */
router.get("/active", getActiveFollowUps);

/* ================= EXTRA UTILITY ROUTES FOR EXTENDED CONTROL ================= */

/**
 * @route   GET /api/leads/route/:location
 * @desc    Get pending client actions based on vehicle route location (e.g., LAKHISARAI, DUMKA)
 * @access  Private (Admin/Drivers/Logistics Manager)
 */
router.get("/route/:location", getLeadsByRouteLocation);

/**
 * @route   PUT /api/leads/follow-ups/:id
 * @desc    Update lead status (e.g., PENDING -> ORDER_RECEIVED or COMPLAINT_RESOLVED)
 * @access  Private (Admin/Accountant)
 */
router.put("/follow-ups/:id", updateLeadStatus);

export default router;