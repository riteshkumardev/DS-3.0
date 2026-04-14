import express from "express";
const router = express.Router();

// Controllers Import
import { 
    createProduct, 
    getAllProducts, 
    getProductById, 
    updateProduct, 
    deleteProduct 
} from "../controllers/productController.js";

// Middlewares Import
import { protect, authorize } from "../middlewares/authMiddleware.js";

/**
 * Product Master Routes - Dharashakti Agro Products
 * Base Path: /api/products
 */

// 1. List & Create
// GET: Sabhi staff dekh sakte hain (Purchase/Sale form bharte waqt)
// POST: Sirf ADMIN ya MANAGER hi naya product add kar sakta hai
router.route("/")
    .get(protect, getAllProducts)
    .post(protect, authorize('ADMIN', 'MANAGER'), createProduct);

// 2. Single Product, Update & Delete
// GET: Product details dekhne ke liye
// PUT: Master data edit karne ke liye (Strictly Admin/Manager)
// DELETE: Sirf Admin delete kar sakta hai
router.route("/:id")
    .get(protect, getProductById)
    .put(protect, authorize('ADMIN', 'MANAGER'), updateProduct)
    .delete(protect, authorize('ADMIN'), deleteProduct);

export default router;