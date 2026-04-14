import User from "../models/User.js";
import Log from "../models/Log.js"; 
import generateToken from "../utils/generateToken.js";
import { ROLES } from "../utils/constants.js";

/**
 * Professional Authentication Controller - Dharashakti ERP 3.0
 */

// 1. LOGIN USER (Smart Login: Email OR Employee ID)
export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body; 

        // Check email or employeeId (Case insensitive for email, Uppercase for ID)
        const user = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { employeeId: email.toUpperCase() }
            ]
        }).select("+password");
        
        if (user && (await user.matchPassword(password))) {
            if (!user.isActive) {
                res.status(403);
                throw new Error("Account deactivated. Please contact Administrator.");
            }

            user.lastLogin = Date.now();
            await user.save();

            res.json({
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
        } else {
            res.status(401);
            throw new Error("Invalid Identity or Password");
        }
    } catch (error) {
        next(error);
    }
};

// 2. REGISTER USER (With Auto-ID Generation & Log Fix)
export const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            res.status(400);
            throw new Error("User with this email already exists");
        }

        // 🔢 Auto-generate Employee ID (DS-XXXX)
        const lastUser = await User.findOne({ employeeId: { $exists: true } }).sort({ createdAt: -1 });
        
        let newIdNumber = 1001; 
        if (lastUser && lastUser.employeeId) {
            const lastIdParts = lastUser.employeeId.split('-');
            if(lastIdParts[1]) {
                newIdNumber = parseInt(lastIdParts[1]) + 1;
            }
        }
        const generatedEmployeeId = `DS-${newIdNumber}`;

        const user = await User.create({
            name: name.toUpperCase(),
            email: email.toLowerCase(),
            employeeId: generatedEmployeeId, 
            password,
            role: role || 'STAFF'
        });

        // ✅ LOG FIX: PerformedBy field handle kiya (Initial user ke liye khud ki ID)
        await Log.create({
            module: 'AUTH',
            action: 'USER_REGISTERED',
            performedBy: req.user ? req.user._id : user._id, 
            details: { employeeId: generatedEmployeeId, email: user.email }
        });

        res.status(201).json({
            success: true,
            message: "Account Created Successfully!",
            data: {
                name: user.name,
                generatedId: user.employeeId,
                email: user.email
            }
        });
    } catch (error) {
        next(error);
    }
};

// 3. GET CURRENT USER PROFILE
export const getMyProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }
        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

// 4. UPDATE USER STATUS (Activate/Deactivate)
export const toggleUserStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }

        if (user._id.toString() === req.user._id.toString()) {
            res.status(400);
            throw new Error("You cannot deactivate your own account");
        }

        user.isActive = !user.isActive;
        await user.save();

        // Audit Log
        await Log.create({
            module: 'AUTH',
            action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
            performedBy: req.user._id,
            details: { targetUser: user.email }
        });

        res.json({ 
            success: true, 
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully` 
        });
    } catch (error) {
        next(error);
    }
};

// 5. GET ALL USERS (Admin View)
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

        const users = await User.find(query).select("-password").sort({ createdAt: -1 });
        res.json({ success: true, count: users.length, data: users });
    } catch (error) {
        next(error);
    }
};