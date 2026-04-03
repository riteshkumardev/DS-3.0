import express from "express";
import { loginEmployee,unlockEmployee } from "../controllers/auth.controller.js";

const router = express.Router();

// 🔐 Login
router.post("/login", loginEmployee);
// 🔓 Unlock (Ye line missing thi)
router.post("/unlock", unlockEmployee); 

export default router;

