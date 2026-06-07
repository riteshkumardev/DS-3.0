import AuditLog from "../models/AuditLog.js"; // 🔥 Ensure target model path syntax is valid

/**
 * 🚀 PROFESSIONAL AUDIT LOG SERVICE (FINAL)
 * ✔ Non-blocking logging
 * ✔ Crash-safe
 * ✔ IP + Device parsing fixed
 * ✔ Payload size control
 */
class LogService {

    /**
     * 🔧 SAFE STRING
     */
    safeUpper(value, fallback = "UNKNOWN") {
        return String(value || fallback).toUpperCase();
    }

    /**
     * 🔧 EXTRACT IP
     */
    getIP(req) {
        if (!req) return "SYSTEM";

        let ip =
            req.headers["x-forwarded-for"] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            req.ip;

        if (ip && ip.includes(",")) {
            ip = ip.split(",")[0].trim();
        }

        return ip || "UNKNOWN";
    }

    /**
     * 🔧 LIMIT LARGE OBJECTS
     */
    sanitizeData(data, maxLength = 2000) {
        try {
            if (!data) return null;

            let str = JSON.stringify(data);

            if (str.length > maxLength) {
                return str.substring(0, maxLength) + "...[TRUNCATED]";
            }

            return JSON.parse(str);
        } catch {
            return null;
        }
    }

    /**
     * @desc CREATE LOG (NON-BLOCKING)
     */
    async createLog({
        performedBy,
        action,
        module,
        documentId,
        oldValue,
        newValue,
        remark,
        req
    }) {
        try {
            const logData = {
                performedBy: performedBy || null,
                action: this.safeUpper(action),
                module: this.safeUpper(module),
                documentId: documentId || null,
                oldValue: this.sanitizeData(oldValue),
                newValue: this.sanitizeData(newValue),
                ipAddress: this.getIP(req),
                deviceInfo: req?.headers?.["user-agent"] || "UNKNOWN",
                remark:
                    remark ||
                    `Activity recorded in ${this.safeUpper(module)} module`,
            };

            // 🔥 NON-BLOCKING (no await execution loop block)
            AuditLog.create(logData).catch((err) => {
                console.error("❌ Log Save Failed:", err.message);
            });

            return true;

        } catch (error) {
            console.error("❌ Critical Logging Error:", error.message);
            return false;
        }
    }

    /**
     * 📦 STOCK ADJUSTMENT LOG
     */
    async logStockAdjustment(userId, productId, oldQty, newQty, remark, req) {
        return this.createLog({
            performedBy: userId,
            action: "STOCK_ADJUSTMENT",
            module: "STOCK",
            documentId: productId,
            oldValue: { quantity: oldQty },
            newValue: { quantity: newQty },
            remark,
            req,
        });
    }

    /**
     * 🗑️ DELETE LOG
     */
    async logDeletion(userId, module, docId, data, req) {
        return this.createLog({
            performedBy: userId,
            action: `DELETE_${this.safeUpper(module)}`,
            module,
            documentId: docId,
            oldValue: data,
            remark: `CRITICAL: Document deleted from ${this.safeUpper(module)}`,
            req,
        });
    }

    /**
     * ✏️ UPDATE LOG (NEW - IMPORTANT)
     */
    async logUpdate(userId, module, docId, oldData, newData, req) {
        return this.createLog({
            performedBy: userId,
            action: `UPDATE_${this.safeUpper(module)}`,
            module,
            documentId: docId,
            oldValue: oldData,
            newValue: newData,
            remark: `Document updated in ${this.safeUpper(module)}`,
            req,
        });
    }

    /**
     * ➕ CREATE LOG (NEW)
     */
    async logCreate(userId, module, docId, data, req) {
        return this.createLog({
            performedBy: userId,
            action: `CREATE_${this.safeUpper(module)}`,
            module,
            documentId: docId,
            newValue: data,
            remark: `New record created in ${this.safeUpper(module)}`,
            req,
        });
    }
}

export default new LogService();