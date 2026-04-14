// errorMiddleware.js
import logger from '../utils/logger.js';

/**
 * Professional Global Error Handler
 * Dharashakti Agro Products ERP
 */

// 1. Not Found Middleware (Jab koi galat URL hit kare)
export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// 2. Custom Error Handler (Pakda gaya har error yahan se pass hoga)
export const errorHandler = (err, req, res, next) => {
    // Agar status code 200 hai par error aaya hai, toh usey 500 (Server Error) kar dein
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // --- Mongoose Specific Errors ---

    // 1. CastError (Galti se galat ID bhejna)
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 404;
        message = 'Resource not found: Invalid ID format';
    }

    // 2. Duplicate Key Error (e.g., Same Bill No ya Phone double entry)
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue);
        message = `Duplicate field value entered: ${field}. Please use another value.`;
    }

    // 3. ValidationError (Schema rules follow nahi kiye)
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map((val) => val.message).join(', ');
    }

    // --- Log the error for Admin debugging ---
    logger.error(`${req.method} ${req.originalUrl} - ${message}`);

    res.status(statusCode).json({
        success: false,
        message: message,
        // Stack trace sirf development mode mein dikhayenge, production mein nahi (Security)
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};