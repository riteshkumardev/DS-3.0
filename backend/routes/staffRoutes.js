import express from "express";
const router = express.Router();

// Controllers Import
import { 
    createStaff, 
    getAllStaff, 
    getStaffById, 
    updateStaff, 
    deleteStaff,
    // 🚀 PROFILE CONTROLLERS (Inhe controllers/staffController.js me handle karein)
    updateProfile,      
    changePassword, 
    uploadProfilePhoto 
} from "../controllers/staffController.js";

// Middlewares Import
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { upload } from "../cloudinaryConfig.js"; // ☁️ Cloudinary multer config instance

/**
 * Staff Management Routes - Dharashakti Agro Products
 */

// 1. List & Create: Staff list koi bhi logged-in user dekh sakta hai
// Naya staff sirf Admin ya Manager hi add kar sakta hai
router.route("/")
    .get(protect, getAllStaff)
    .post(protect, authorize('ADMIN', 'MANAGER'), createStaff);

/**
 * ========================================================
 * 🚀 2. LOGGED-IN USER PROFILE OPERATIONS (Self-Management)
 * ========================================================
 * CRITICAL SEQUENCE: Inhe "/:id" ke upar hi rakhna hai taaki Express routing 
 * engine "/profile-upload" string ko dynamic ":id" parameter na samajh le.
 */
router.post("/profile-update", protect, updateProfile);
router.post("/change-password", protect, changePassword);
router.post("/profile-upload", protect, upload.single("photo"), uploadProfilePhoto);

// 3. Individual Staff Details & Updates
router.route("/:id")
    .get(protect, getStaffById)
    .put(protect, authorize('ADMIN', 'MANAGER'), updateStaff)
    .delete(protect, authorize('ADMIN'), deleteStaff); // Termination sirf Admin handle karega

export default router;