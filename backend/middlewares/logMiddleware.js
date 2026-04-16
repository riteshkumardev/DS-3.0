import logService from "../services/logService.js";

/**
 * 🚀 Dharashakti ERP - Activity Logger Middleware (Production Ready)
 */

const activityLogger = (req, res, next) => {

    // ✅ Only log mutation requests
    const monitoredMethods = ["POST", "PUT", "PATCH", "DELETE"];
    if (!monitoredMethods.includes(req.method)) {
        return next();
    }

    // ===============================
    // 🔹 CAPTURE RESPONSE BODY
    // ===============================
    const originalJson = res.json;
    let responseBody;

    res.json = function (body) {
        responseBody = body;
        return originalJson.call(this, body);
    };

    // ===============================
    // 🔹 AFTER RESPONSE FINISH
    // ===============================
    res.on("finish", async () => {
        try {
            // ✅ Only log successful responses
            if (res.statusCode < 200 || res.statusCode >= 300) return;

            // ===============================
            // 🔹 MODULE DETECTION (SMART)
            // ===============================
            const urlParts = req.originalUrl.split("?")[0].split("/").filter(Boolean);

            // e.g. /api/sales/123 → SALES
            let moduleName = "SYSTEM";
            if (urlParts.length >= 2) {
                moduleName = urlParts[1].toUpperCase();
            }

            // ===============================
            // 🔹 ACTION DETECTION
            // ===============================
            const actionMap = {
                POST: "CREATE",
                PUT: "UPDATE",
                PATCH: "UPDATE",
                DELETE: "DELETE"
            };

            const actionPrefix = actionMap[req.method] || "ACTION";
            const action = `${actionPrefix}_${moduleName}`;

            // ===============================
            // 🔹 SENSITIVE DATA CLEANER
            // ===============================
            const sanitize = (data) => {
                if (!data) return null;

                const clone = JSON.parse(JSON.stringify(data));

                const sensitiveFields = ["password", "token", "refreshToken"];

                const removeSensitive = (obj) => {
                    if (typeof obj !== "object" || obj === null) return;

                    Object.keys(obj).forEach((key) => {
                        if (sensitiveFields.includes(key)) {
                            obj[key] = "******";
                        } else if (typeof obj[key] === "object") {
                            removeSensitive(obj[key]);
                        }
                    });
                };

                removeSensitive(clone);
                return clone;
            };

            // ===============================
            // 🔹 DOCUMENT ID DETECTION
            // ===============================
            const documentId =
                req.params?.id ||
                responseBody?.data?._id ||
                null;

            // ===============================
            // 🔹 NON-BLOCKING LOGGING
            // ===============================
            setImmediate(async () => {
                await logService.createLog({
                    performedBy: req.user ? req.user._id : null,
                    action,
                    module: moduleName,
                    documentId,
                    oldValue: null, // (optional future use)
                    newValue: sanitize(req.body),
                    remark: `${req.method} ${req.originalUrl}`,
                    req
                });
            });

        } catch (error) {
            console.error("❌ Activity Logger Error:", error.message);
        }
    });

    next();
};

export default activityLogger;