// purchaseRoutes.js
import express from "express";
const router = express.Router();

// Controllers Import
import { 
    createPurchase, 
    getAllPurchases, 
    updatePurchase, 
    deletePurchase 
} from "../controllers/purchaseController.js";

// Middlewares Import
import { protect, authorize } from "../middlewares/authMiddleware.js";

/**
 * Purchase Routes - Dharashakti Agro Products
 * Inventory Inward & Supplier Management
 */

// 1. List & Create: Staff purchase entry kar sakta hai, Admin monitor karega
// Query params support: ?startDate=...&endDate=...&supplierName=...
router.route("/")
    .get(protect, getAllPurchases)
    .post(protect, createPurchase);

// 2. Edit & Delete: Inward entry badalna risky hota hai, isliye Restricted hai
router.route("/:id")
    .put(protect, authorize('ADMIN', 'MANAGER'), updatePurchase)
    .delete(protect, authorize('ADMIN'), deletePurchase); // Only Admin can delete

export default router;