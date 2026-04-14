import express from "express";
const router = express.Router();

// Controllers Import
import { 
    loginUser, 
    registerUser, 
    getMyProfile, 
    toggleUserStatus, 
    getAllUsers 
} from "../controllers/authController.js";

// Middlewares Import
import { protect, authorize } from "../middlewares/authMiddleware.js";
import validate, { userSchema } from "../middlewares/validateRequest.js";

/**
 * Auth Routes - Dharashakti Agro Products ERP 3.0
 */

// 🔓 Public Routes
// Koi bhi login kar sakta hai
router.post("/login", loginUser);

/**
 * 🛡️ Register Route Note: 
 * Jab tak aap pehla Admin create nahi kar lete, yahan se 'protect' aur 'authorize' hata kar rakhein.
 * Ek baar Admin ban jaye, toh security ke liye wapas 'protect' laga dein.
 */
router.post("/register", validate(userSchema), registerUser); 


// 🔒 Protected Routes (Sabhi login users ke liye)
router.get("/profile", protect, getMyProfile);


// 🛡️ Admin Only Routes (Staff Management)
router.route("/users")
    .get(protect, authorize('ADMIN'), getAllUsers);

// User status toggle (Active/Deactive)
router.patch("/users/:id/status", protect, authorize('ADMIN'), toggleUserStatus);

export default router;