import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * 🚀 Dharashakti ERP - Auth Middleware (v3 Professional)
 */

// ===============================
// 🔹 TOKEN EXTRACTOR (Helper)
// ===============================
const getTokenFromRequest = (req) => {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token && req.cookies?.token) {
        token = req.cookies.token;
    }
    return token;
};

// ===============================
// 🔹 PROTECT MIDDLEWARE
// ===============================
export const protect = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            res.status(401);
            throw new Error("Not authorized, token missing");
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from DB
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            res.status(401);
            throw new Error("User not found or deleted");
        }

        if (user.status === "LEFT" || user.status === "TERMINATED") {
            res.status(403);
            throw new Error("Your account has been blocked by Admin");
        }

        // Attach user to req object
        req.user = user;
        next();

    } catch (error) {
        next(error);
    }
};

// ===============================
// 🔹 ADMIN MIDDLEWARE (Legacy Support for Routes)
// ===============================
// Isse aapka 'ERR_MODULE_NOT_FOUND' wala error fix ho jayega
export const admin = (req, res, next) => {
    if (req.user && req.user.role === "ADMIN") {
        next();
    } else {
        res.status(403);
        const error = new Error("Access denied: Admin privileges required");
        next(error);
    }
};

// ===============================
// 🔹 DYNAMIC ROLE AUTHORIZATION
// ===============================
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401);
                throw new Error("Not authorized, user data missing");
            }

            if (!allowedRoles.includes(req.user.role)) {
                res.status(403);
                throw new Error(`Access denied: Role '${req.user.role}' is not authorized`);
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};

// ===============================
// 🔹 ROLE HIERARCHY LOGIC
// ===============================
const roleHierarchy = {
    ADMIN: 4,
    MANAGER: 3,
    ACCOUNTANT: 2,
    STAFF: 1,
    WORKER: 0
};

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
                throw new Error(`Access denied: Minimum role required is ${minRole}`);
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};