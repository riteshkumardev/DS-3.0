import User from "../models/User.js";
import logService from "../services/logService.js";
import generateToken from "../utils/generateToken.js";

/**
 * Dharashakti ERP - Authentication Controller (Production Ready)
 */

// 1. LOGIN USER
export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400);
            throw new Error("Email/Employee ID and Password are required");
        }

        const user = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { employeeId: email.toUpperCase() }
            ]
        }).select("+password");

        if (!user || !(await user.matchPassword(password))) {
            res.status(401);
            throw new Error("Invalid Identity or Password");
        }

        if (!user.isActive) {
            res.status(403);
            throw new Error("Account deactivated. Contact Admin.");
        }

        user.lastLogin = new Date();
        await user.save();

        // ✅ LOG LOGIN
        await logService.createLog({
            performedBy: user._id,
            action: "LOGIN",
            module: "AUTH",
            documentId: user._id,
            remark: `User logged in (${user.employeeId})`,
            req
        });

        res.status(200).json({
            success: true,
            message: `Welcome back, ${user.name}`,
            data: {
                _id: user._id,
                employeeId: user.employeeId,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            }
        });

    } catch (error) {
        next(error);
    }
};


// 2. REGISTER USER
export const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            res.status(400);
            throw new Error("Name, Email and Password are required");
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(400);
            throw new Error("User already exists with this email");
        }

        // 🔢 Generate Employee ID
        const lastUser = await User.findOne({ employeeId: { $exists: true } })
            .sort({ createdAt: -1 });

        let newIdNumber = 1001;
        if (lastUser?.employeeId) {
            const num = parseInt(lastUser.employeeId.split('-')[1]);
            if (!isNaN(num)) newIdNumber = num + 1;
        }

        const employeeId = `DS-${newIdNumber}`;

        const user = await User.create({
            name: name.toUpperCase(),
            email: email.toLowerCase(),
            password,
            employeeId,
            role: role || "STAFF"
        });

        // ✅ LOG REGISTER
        await logService.createLog({
            performedBy: req.user ? req.user._id : user._id,
            action: "USER_REGISTER",
            module: "AUTH",
            documentId: user._id,
            newValue: {
                employeeId,
                email: user.email
            },
            remark: "New user registered",
            req
        });

        res.status(201).json({
            success: true,
            message: "User Registered Successfully",
            data: {
                name: user.name,
                employeeId,
                email: user.email
            }
        });

    } catch (error) {
        next(error);
    }
};


// 3. GET MY PROFILE
export const getMyProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        next(error);
    }
};


// 4. TOGGLE USER STATUS (Activate / Deactivate)
export const toggleUserStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }

        if (user._id.toString() === req.user._id.toString()) {
            res.status(400);
            throw new Error("You cannot change your own status");
        }

        const oldStatus = user.isActive;
        user.isActive = !user.isActive;

        await user.save();

        // ✅ LOG STATUS CHANGE
        await logService.createLog({
            performedBy: req.user._id,
            action: user.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
            module: "AUTH",
            documentId: user._id,
            oldValue: { isActive: oldStatus },
            newValue: { isActive: user.isActive },
            remark: "User status changed",
            req
        });

        res.status(200).json({
            success: true,
            message: `User ${user.isActive ? "Activated" : "Deactivated"} Successfully`
        });

    } catch (error) {
        next(error);
    }
};


// 5. GET ALL USERS (Admin)
export const getAllUsers = async (req, res, next) => {
    try {
        const { role, search } = req.query;

        let query = {};

        if (role) query.role = role;

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { employeeId: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const users = await User.find(query)
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });

    } catch (error) {
        next(error);
    }
};