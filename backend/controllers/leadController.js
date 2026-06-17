import LeadFollowUp from "../models/LeadFollowUp.js";

// 1. Record New Lead/Follow-up
export const createFollowUp = async (req, res, next) => {
    try {
        const { partyName, mobileNumber, address, remarks, status, followUpDate, actionTrigger, routeLocation } = req.body;

        const lead = new LeadFollowUp({
            partyName,
            mobileNumber: mobileNumber || "N/A",
            address,
            remarks,
            status: status || 'PENDING',
            followUpDate: new Date(followUpDate),
            actionTrigger: actionTrigger || 'DATE_BASED',
            routeLocation: routeLocation ? String(routeLocation).toUpperCase() : ""
        });

        const savedLead = await lead.save();
        res.status(201).json({ success: true, data: savedLead });
    } catch (error) {
        next(error);
    }
};

// 2. Get Follow-ups for Dashboard Alerts (Today + Overdue)
export const getActiveFollowUps = async (req, res, next) => {
    try {
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Aaj ki date tak ke saare PENDING follow-ups nikalenge
        const activeLeads = await LeadFollowUp.find({
            status: { $in: ['PENDING', 'CALLBACK_REQUIRED'] },
            followUpDate: { $lte: todayEnd }
        }).sort({ followUpDate: 1 });

        res.status(200).json({ success: true, count: activeLeads.length, data: activeLeads });
    } catch (error) {
        next(error);
    }
};