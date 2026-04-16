// logController.js
import Log from "../models/Log.js";

/**
 * Professional Audit Log Controller (Admin Monitoring)
 * Dharashakti Agro Products ERP
 */

// ==========================================
// 1. GET ALL LOGS (With Deep Filtering + Safe Pagination)
// ==========================================
export const getAllLogs = async (req, res, next) => {
    try {
        const {
            user,
            module,
            action,
            startDate,
            endDate,
            limit = 50,
            page = 1
        } = req.query;

        let query = {};

        // ✅ USER FILTER
        if (user) {
            query.performedBy = user;
        }

        // ✅ MODULE FILTER (Safe Uppercase)
        if (module) {
            query.module = String(module).toUpperCase();
        }

        // ✅ ACTION FILTER
        if (action) {
            query.action = String(action).toUpperCase();
        }

        // ✅ DATE FILTER (Safe handling)
        if (startDate || endDate) {
            query.createdAt = {};

            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // full day cover
                query.createdAt.$lte = end;
            }
        }

        // ✅ PAGINATION FIX (avoid NaN / negative)
        const parsedLimit = Math.max(parseInt(limit) || 50, 1);
        const parsedPage = Math.max(parseInt(page) || 1, 1);
        const skip = (parsedPage - 1) * parsedLimit;

        // ✅ FETCH LOGS
        const logs = await Log.find(query)
            .populate('performedBy', 'name role')
            .sort({ createdAt: -1 })
            .limit(parsedLimit)
            .skip(skip)
            .lean(); // performance boost

        const total = await Log.countDocuments(query);

        res.status(200).json({
            success: true,
            count: logs.length,
            totalRecords: total,
            totalPages: Math.ceil(total / parsedLimit),
            currentPage: parsedPage,
            data: logs
        });

    } catch (error) {
        console.error("❌ Log Fetch Error:", error.message);
        next(error);
    }
};

// ==========================================
// 2. GET DOCUMENT HISTORY (Optimized)
// ==========================================
export const getDocumentHistory = async (req, res, next) => {
    try {
        const { docId } = req.params;

        if (!docId) {
            return res.status(400).json({
                success: false,
                message: "Document ID is required"
            });
        }

        const history = await Log.find({ documentId: docId })
            .populate('performedBy', 'name')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            count: history.length,
            data: history
        });

    } catch (error) {
        console.error("❌ Document History Error:", error.message);
        next(error);
    }
};

// ==========================================
// 3. DELETE OLD LOGS (Safe Cleanup)
// ==========================================
export const clearOldLogs = async (req, res, next) => {
    try {
        let { days = 90 } = req.body;

        days = Number(days);

        // ✅ VALIDATION
        if (!days || days <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid days value"
            });
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const result = await Log.deleteMany({
            createdAt: { $lt: cutoffDate }
        });

        res.status(200).json({
            success: true,
            message: `${result.deletedCount} old logs cleared from system.`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error("❌ Log Cleanup Error:", error.message);
        next(error);
    }
};