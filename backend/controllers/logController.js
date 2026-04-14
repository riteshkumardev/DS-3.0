// logController.js
import Log from "../models/Log.js";

/**
 * Professional Audit Log Controller (Admin Monitoring)
 * Dharashakti Agro Products ERP
 */

// 1. GET ALL LOGS (With Deep Filtering)
export const getAllLogs = async (req, res, next) => {
    try {
        const { user, module, action, startDate, endDate, limit = 50, page = 1 } = req.query;
        let query = {};

        // Filter by User ID
        if (user) {
            query.performedBy = user;
        }

        // Filter by Module (e.g., SALE, PURCHASE, STOCK)
        if (module) {
            query.module = module.toUpperCase();
        }

        // Filter by Action Type (e.g., CREATE_SALE, DELETE_STOCK)
        if (action) {
            query.action = action.toUpperCase();
        }

        // Filter by Date Range
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Pagination Logic (Zaruri hai kyunki logs hazaron mein ho sakte hain)
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const logs = await Log.find(query)
            .populate('performedBy', 'name role') // User ka naam aur role dikhane ke liye
            .sort({ createdAt: -1 }) // Sabse naya log sabse upar
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Log.countDocuments(query);

        res.status(200).json({
            success: true,
            count: logs.length,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: logs
        });
    } catch (error) {
        next(error);
    }
};

// 2. GET LOGS FOR A SPECIFIC DOCUMENT (Document History)
export const getDocumentHistory = async (req, res, next) => {
    try {
        const { docId } = req.params;

        const history = await Log.find({ documentId: docId })
            .populate('performedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        next(error);
    }
};

// 3. DELETE OLD LOGS (System Maintenance)
export const clearOldLogs = async (req, res, next) => {
    try {
        const { days = 90 } = req.body; // Default 90 din se purane logs delete karein
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const result = await Log.deleteMany({ createdAt: { $lt: cutoffDate } });

        res.status(200).json({
            success: true,
            message: `${result.deletedCount} old logs cleared from system.`
        });
    } catch (error) {
        next(error);
    }
};