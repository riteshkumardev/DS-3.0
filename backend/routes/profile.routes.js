import express from "express";
import multer from "multer";
import { 
  uploadProfileImage, 
  updateProfile, 
  changePassword, 
  logoutUser 
} from "../controllers/profile.controller.js";

const router = express.Router();

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Saare routes POST rakhe hain taaki frontend se match karein
router.post("/upload", upload.single("photo"), uploadProfileImage); // Frontend API: /api/profile/upload
router.post("/update", updateProfile);                              // Frontend API: /api/profile/update
router.post("/change-password", changePassword);                    // Frontend API: /api/profile/change-password
router.post("/logout", logoutUser);                                 // Frontend API: /api/profile/logout

export default router;