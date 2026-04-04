import express from "express";
import { 
  uploadProfileImage, 
  updateProfile, 
  changePassword, 
  logoutUser 
} from "../controllers/profile.controller.js";

// ✅ 1. Purana local multer hata kar Cloudinary wala upload import karein
import { upload } from "../cloudinaryConfig.js"; 

const router = express.Router();

// ✅ 2. Ab ye 'upload' wahi hai jo CloudinaryStorage use kar raha hai
// Frontend API: /api/profile/upload
router.post("/upload", upload.single("photo"), uploadProfileImage); 

router.post("/update", updateProfile);
router.post("/change-password", changePassword);
router.post("/logout", logoutUser);

export default router;