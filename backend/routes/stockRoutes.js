// stockRoutes.js
import express from "express";
const router = express.Router();

// Controllers Import
import { 
    createProduct, 
    getAllProducts, 
    updateProduct, 
    deleteProduct,
    adjustStock 
} from "../controllers/stockController.js";

// Middlewares Import
import { protect, authorize } from "../middlewares/authMiddleware.js";

/**
 * Stock & Inventory Routes - Dharashakti Agro Products
 */

// 1. Products List & Creation
// Query params support: ?search=...&category=...&minStock=10
router.route("/")
    .get(protect, getAllProducts)
    .post(protect, authorize('ADMIN', 'MANAGER'), createProduct);

// 2. Manual Stock Adjustment (Wastage, Damage, or Correction)
// Iska use tab hoga jab physical stock aur digital stock match na kare
router.post("/adjust", protect, authorize('ADMIN', 'MANAGER'), adjustStock);

// 3. Update & Delete Product
router.route("/:id")
    .put(protect, authorize('ADMIN', 'MANAGER'), updateProduct)
    .delete(protect, authorize('ADMIN'), deleteProduct); // Stock 0 hone par hi delete hoga

export default router;