import express from "express";
import multer from "multer";
import path from "path";
import {
  createEmployee,
  getAllEmployees,
  updateEmployeeStatus,
  deleteEmployee
} from "../controllers/employees.controller.js";

const router = express.Router();

// --- 🖼️ MULTER CONFIGURATION ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure 'uploads' folder exists in root
  },
  filename: (req, file, cb) => {
    // Unique filename: Date + Original Extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File Filter (Optional: Only Images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

// --- 🚀 ROUTE CONFIGURATION ---

/**
 * @post /api/employees
 * Frontend se form-data bhejein jisme key 'image' ho
 */
router.post("/", upload.single("image"), createEmployee);

/**
 * @get /api/employees
 */
router.get("/", getAllEmployees);

/**
 * @put /api/employees/:employeeId
 * Update ke waqt bhi image change karne ka option
 */
router.put("/:employeeId", upload.single("image"), updateEmployeeStatus);

/**
 * @delete /api/employees/:id
 */
router.delete("/:id", deleteEmployee);

export default router;