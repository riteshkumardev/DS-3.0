// logService.js
import AuditLog from "../models/AuditLog.js";

/**
 * Professional Audit Logging Service
 * Dharashakti Agro Products ERP
 */
class LogService {
    
    /**
     * @desc    Create a new activity log
     * @param   {Object} logData - user, action, module, docId, oldVal, newVal, remark, req
     */
    async createLog({ performedBy, action, module, documentId, oldValue, newValue, remark, req }) {
        try {
            // Get IP and Device Info from request object if available
            const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : 'SYSTEM';
            const deviceInfo = req ? req.headers['user-agent'] : 'UNKNOWN';

            const log = new AuditLog({
                performedBy,
                action: action.toUpperCase(),
                module: module.toUpperCase(),
                documentId,
                oldValue: oldValue || null,
                newValue: newValue || null,
                ipAddress,
                deviceInfo,
                remark: remark || `Activity recorded in ${module} module`
            });

            await log.save();
            return log;
        } catch (error) {
            // Hum system ko crash nahi karenge agar logging fail ho jaye
            console.error("Critical Logging Error:", error.message);
        }
    }

    /**
     * @desc    Specific log for Stock Adjustments
     */
    async logStockAdjustment(userId, productId, oldQty, newQty, remark, req) {
        return await this.createLog({
            performedBy: userId,
            action: 'STOCK_ADJUSTMENT',
            module: 'STOCK',
            documentId: productId,
            oldValue: { quantity: oldQty },
            newValue: { quantity: newQty },
            remark,
            req
        });
    }

    /**
     * @desc    Specific log for Critical Deletions (Sale/Purchase)
     */
    async logDeletion(userId, module, docId, data, req) {
        return await this.createLog({
            performedBy: userId,
            action: `DELETE_${module}`,
            module,
            documentId: docId,
            oldValue: data,
            remark: `CRITICAL: Document deleted from ${module}`,
            req
        });
    }
}

export default new LogService();