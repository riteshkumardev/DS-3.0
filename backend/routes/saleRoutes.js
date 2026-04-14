// saleRoutes.js
import express from "express";
const router = express.Router();

// Controllers Import
import { 
    createSale, 
    getAllSales, 
    getSaleById, 
    deleteSale 
} from "../controllers/saleController.js";

// Middlewares Import
import { protect, authorize } from "../middlewares/authMiddleware.js";

/**
 * Sale Routes - Dharashakti Agro Products
 * Billing, GST Outward & Customer Management
 */

// 1. List & Create: Sales staff entries kar sakte hain
// Filters support: ?customerName=...&billNo=...&startDate=...&endDate=...
router.route("/")
    .get(protect, getAllSales)
    .post(protect, createSale);

// 2. Single Sale Detail: Bill print karne ya view karne ke liye
router.get("/:id", protect, getSaleById);

// 3. Delete: Sale delete karna sabse bada risk hai (Stock/Ledger reverse hota hai)
// Isliye sirf ADMIN ko hi ye power di gayi hai
router.delete("/:id", protect, authorize('ADMIN'), deleteSale);

export default router;