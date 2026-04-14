// logMiddleware.js
import logService from "../services/logService.js";

/**
 * Professional Activity Logging Middleware
 * Dharashakti Agro Products ERP
 */
const activityLogger = async (req, res, next) => {
    // Sirf wahi requests log karenge jo data badalti hain (Mutations)
    const monitoredMethods = ['POST', 'PUT', 'DELETE'];
    
    if (!monitoredMethods.includes(req.method)) {
        return next();
    }

    // Response khatam hone ka intezar karein taaki humein pata chale action success hua ya nahi
    res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
                // URL se module ka naam nikalna (e.g., /api/sales -> SALE)
                const pathParts = req.originalUrl.split('/');
                const moduleName = pathParts[2] ? pathParts[2].slice(0, -1).toUpperCase() : 'SYSTEM';

                // Action define karna
                let action = '';
                switch (req.method) {
                    case 'POST': action = `CREATE_${moduleName}`; break;
                    case 'PUT': action = `UPDATE_${moduleName}`; break;
                    case 'DELETE': action = `DELETE_${moduleName}`; break;
                }

                // Log create karna (logService ka use karke)
                await logService.createLog({
                    performedBy: req.user ? req.user._id : null,
                    action: action,
                    module: moduleName,
                    documentId: req.params.id || null,
                    // Security: Password jaise sensitive data ko newValue se hatana
                    newValue: req.body ? { ...req.body, password: undefined } : null,
                    remark: `Automatic log via ${req.method} request`,
                    req: req
                });

            } catch (error) {
                console.error("Middleware Logging Error:", error.message);
            }
        }
    });

    next();
};

export default activityLogger;