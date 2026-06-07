import express from "express";
import { 
    getSelfProfile, 
    updateSelfProfile, 
    changeSelfPassword, 
    uploadSelfPhoto,
    logoutSelfSession
} from "../controllers/profileController.js";
import { protect } from "../middlewares/authMiddleware.js"; 
import { upload } from "../cloudinaryConfig.js"; // ☁️ Cloudinary multer config instance // 🔥 FIXED: Path changed from 'middleware' to 'middlewares'

const router = express.Router();

// 🔐 Sabhi routes par active session authentication compulsory hai
router.use(protect);

// 🎯 Relative mappings bound to /api/profile base path inside server.js
router.get("/me", getSelfProfile);
router.post("/update", updateSelfProfile);
router.post("/change-password", changeSelfPassword);

// 📸 Multer multi-part stream field is strictly bound to "photo" identifier key
router.post("/upload", upload.single("photo"), uploadSelfPhoto);
router.post("/logout", logoutSelfSession);

export default router;