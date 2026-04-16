import logger from "../utils/logger.js";

/**
 * 🚀 Dharashakti ERP - Global Error Handling System
 */

// ===============================
// 🔹 1. NOT FOUND HANDLER
// ===============================
export const notFound = (req, res, next) => {
    const error = new Error(`Route Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// ===============================
// 🔹 2. GLOBAL ERROR HANDLER
// ===============================
export const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || "Something went wrong";

    // ===============================
    // 🔹 MONGOOSE ERRORS
    // ===============================

    // Invalid ObjectId
    if (err.name === "CastError" && err.kind === "ObjectId") {
        statusCode = 404;
        message = "Resource not found (Invalid ID)";
    }

    // Duplicate Key
    if (err.code === 11000) {
        statusCode = 400;
        const fields = Object.keys(err.keyValue).join(", ");
        message = `Duplicate value for: ${fields}`;
    }

    // Schema Validation
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((val) => val.message)
            .join(", ");
    }

    // ===============================
    // 🔹 ZOD VALIDATION ERRORS
    // ===============================
    if (err.name === "ZodError") {
        statusCode = 400;
        message = err.errors.map(e => `${e.path.join(".")} : ${e.message}`).join(", ");
    }

    // ===============================
    // 🔹 JWT / AUTH ERRORS
    // ===============================
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token";
    }

    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Session expired. Please login again.";
    }

    // ===============================
    // 🔹 CUSTOM APP ERRORS (Optional)
    // ===============================
    if (err.isOperational) {
        // Already handled custom error
        statusCode = err.statusCode || statusCode;
        message = err.message;
    }

    // ===============================
    // 🔹 LOGGING (DETAILED)
    // ===============================
    logger.error({
        message,
        statusCode,
        method: req.method,
        url: req.originalUrl,
        user: req.user?._id || "GUEST",
        ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        stack: err.stack
    });

    // ===============================
    // 🔹 RESPONSE STRUCTURE
    // ===============================
    res.status(statusCode).json({
        success: false,
        message,
        errorType: err.name || "Error",
        // Dev mode में ही stack दिखेगा
        stack: process.env.NODE_ENV === "production" ? null : err.stack
    });
};