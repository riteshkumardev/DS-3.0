// saleRoutes.js
import express from "express";
const router = express.Router();

// Controllers Import
import { 
    createSale, 
    getAllSales, 
    getSaleById, 
    updateSale, // 👈 Isko controller se import karein
    deleteSale 
} from "../controllers/saleController.js";

// Middlewares Import
import { protect, authorize } from "../middlewares/authMiddleware.js";

/**
 * Sale Routes - Dharashakti Agro Products
 * Billing, GST Outward & Customer Management
 */

// 1. List & Create: Sales staff entries kar sakte hain
router.route("/")
    .get(protect, getAllSales)
    .post(protect, createSale);

// 2. Single Sale Detail, Update & Delete
router.route("/:id")
    .get(protect, getSaleById)
    // ✅ Update Route Added
    // Inventory aur Ledger recalculation ke liye 'ADMIN' ya 'ACCOUNTANT' authorize karna safe rahega
    .put(protect, authorize('ADMIN', 'ACCOUNTANT'), updateSale) 
    // Delete: Sirf ADMIN ke liye
    .delete(protect, authorize('ADMIN'), deleteSale);

export default router;