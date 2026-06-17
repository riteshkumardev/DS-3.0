import LeadFollowUp from "../models/LeadFollowUp.js";

// ==========================================================
// 1. RECORD/CREATE NEW LEAD FOLLOW-UP LOG (Single Entry)
// ==========================================================
export const createFollowUp = async (req, res, next) => {
    try {
        const { partyName, mobileNumber, address, remarks, status, followUpDate, actionTrigger, routeLocation } = req.body;

        if (!partyName || !remarks) {
            res.status(400);
            throw new Error("Party name and conversation remarks are highly mandatory fields.");
        }

        const lead = new LeadFollowUp({
            partyName: String(partyName).trim().toUpperCase(),
            mobileNumber: mobileNumber || "N/A",
            address: address ? String(address).trim().toUpperCase() : "N/A",
            remarks: String(remarks).trim().toUpperCase(),
            status: status ? String(status).toUpperCase() : 'PENDING',
            followUpDate: followUpDate ? new Date(followUpDate) : new Date(),
            actionTrigger: actionTrigger || 'DATE_BASED',
            routeLocation: routeLocation ? String(routeLocation).trim().toUpperCase() : ""
        });

        const savedLead = await lead.save();
        res.status(201).json({ success: true, data: savedLead });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 2. GET ACTIVE ALERTS (Today + Overdue Pending System Logs)
// ==========================================================
export const getActiveFollowUps = async (req, res, next) => {
    try {
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Fetch all PENDING or CALLBACK_REQUIRED records up to the end of today
        const activeLeads = await LeadFollowUp.find({
            status: { $in: ['PENDING', 'CALLBACK_REQUIRED'] },
            followUpDate: { $lte: todayEnd }
        }).sort({ followUpDate: 1 });

        res.status(200).json({ success: true, count: activeLeads.length, data: activeLeads });
    } catch (error) {
        next(error);
    }
};

// ==========================================================
// 3. GET PENDING ACTIONS BY VEHICLE ROUTE LOCATION
// ==========================================================
export const getLeadsByRouteLocation = async (req, res, next) => {
    try {
        const { location } = req.params;
        if (!location) {
            res.status(400);
            throw new Error("Route location parameter is mandatory.");
        }

        const cleanLocation = String(location).trim().toUpperCase();

        // 🚀 BUG FIX: Native model reference setup done (Eliminated req.model context error)
        const routeLeads = await LeadFollowUp.find({
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
};

// ==========================================================
// 4. UPDATE LEAD STATUS MUTATIONS (Atomic State Machine Patch)
// ==========================================================
export const updateLeadStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;

        let updateData = {};
        if (status) updateData.status = String(status).toUpperCase();
        if (remarks) updateData.remarks = String(remarks).toUpperCase();

        // 🚀 BUG FIX: Replaced req.model with imported LeadFollowUp object schema instance
        const updatedLead = await LeadFollowUp.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedLead) {
            res.status(404);
            throw new Error("Lead action log record not found for this structural ID.");
        }

        res.status(200).json({
            success: true,
            message: "Lead action status mutated successfully",
            data: updatedLead
        });
    } catch (error) {
        next(error);
    }
};