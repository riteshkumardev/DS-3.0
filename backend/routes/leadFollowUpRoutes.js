import express from "express";
import { 
    createFollowUp, 
    getActiveFollowUps 
} from "../controllers/leadController.js"; // Aapka pichla controller file link

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
router.get("/route/:location", async (req, res, next) => {
    try {
        const { location } = req.params;
        if (!location) {
            return res.status(400).json({ success: false, message: "Route location is mandatory" });
        }

        const cleanLocation = String(location).trim().toUpperCase();

        // Gaadi jis route par ja rahi hai, uske saare pending checklist alerts nikalenge
        const routeLeads = await req.model('LeadFollowUp').find({
            routeLocation: cleanLocation,
            status: { $in: ['PENDING', 'CALLBACK_REQUIRED'] }
        }).sort({ followUpDate: 1 });

        res.status(200).json({
            success: true,
            count: routeLeads.length,
            data: routeLeads
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   PUT /api/leads/follow-ups/:id
 * @desc    Update lead status (e.g., PENDING -> ORDER_RECEIVED or COMPLAINT_RESOLVED)
 * @access  Private (Admin/Accountant)
 */
router.put("/follow-ups/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;

        let updateData = {};
        if (status) updateData.status = String(status).toUpperCase();
        if (remarks) updateData.remarks = String(remarks).toUpperCase();

        const updatedLead = await req.model('LeadFollowUp').findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedLead) {
            return res.status(404).json({ success: false, message: "Lead log record not found" });
        }

        res.status(200).json({
            success: true,
            message: "Lead action status mutated successfully",
            data: updatedLead
        });
    } catch (error) {
        next(error);
    }
});

export default router;