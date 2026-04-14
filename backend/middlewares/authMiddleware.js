// authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Professional Authentication & Authorization Middleware
 * Dharashakti Agro Products ERP
 */

// 1. Protect Routes (Verify JWT Token)
export const protect = async (req, res, next) => {
    let token;

    // Check header for Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dharashakti_super_secret_key_2026');

            // Get user from the token and attach to request (excluding password)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User no longer exists' });
            }

            if (!req.user.isActive) {
                return res.status(403).json({ success: false, message: 'User account is deactivated' });
            }

            next();
        } catch (error) {
            console.error('Auth Error:', error.message);
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token found' });
    }
};

// 2. Role-Based Access Control (RBAC)
// Usage: authorize('ADMIN', 'MANAGER')
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `User role '${req.user?.role}' is not authorized to access this route` 
            });
        }
        next();
    };
};