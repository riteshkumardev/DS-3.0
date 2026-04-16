import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * 🚀 Dharashakti ERP - Auth Middleware (Production Ready)
 */

// ===============================
// 🔹 TOKEN EXTRACTOR
// ===============================
const getTokenFromRequest = (req) => {
    let token = null;

    // 1. Authorization Header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    // 2. Cookies (Optional future support)
    if (!token && req.cookies?.token) {
        token = req.cookies.token;
    }

    return token;
};

// ===============================
// 🔹 PROTECT ROUTES
// ===============================
export const protect = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            res.status(401);
            throw new Error("Not authorized, token missing");
        }

        // ✅ Verify token (NO fallback secret)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ✅ Fetch user
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            res.status(401);
            throw new Error("User not found or deleted");
        }

        if (!user.isActive) {
            res.status(403);
            throw new Error("User account is deactivated");
        }

        // ✅ Attach to request
        req.user = user;

        next();

    } catch (error) {
        // ❗ Pass to global error handler (important)
        next(error);
    }
};

// ===============================
// 🔹 ROLE BASED ACCESS CONTROL
// ===============================
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401);
                throw new Error("Not authorized, user missing");
            }

            if (!allowedRoles.includes(req.user.role)) {
                res.status(403);
                throw new Error(
                    `Access denied: Role '${req.user.role}' not allowed`
                );
            }

            next();

        } catch (error) {
            next(error);
        }
    };
};

// ===============================
// 🔹 OPTIONAL: ROLE HIERARCHY (ADVANCED)
// ===============================
const roleHierarchy = {
    ADMIN: 4,
    MANAGER: 3,
    ACCOUNTANT: 2,
    STAFF: 1
};

// Usage: authorizeLevel("MANAGER")
export const authorizeLevel = (minRole) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401);
                throw new Error("Not authorized");
            }

            const userLevel = roleHierarchy[req.user.role] || 0;
            const requiredLevel = roleHierarchy[minRole] || 0;

            if (userLevel < requiredLevel) {
                res.status(403);
                throw new Error(
                    `Access denied: Minimum role required is ${minRole}`
                );
            }

            next();

        } catch (error) {
            next(error);
        }
    };
};