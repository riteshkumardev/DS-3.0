import express from "express";
// 🆕 'addPurchase' ko hata kar 'addStockItem' import karein
import { addStockItem, getStocks, updateStock, deleteStock } from "../controllers/stock.controller.js";

const router = express.Router();

/* =========================================
    📦 INDEPENDENT STOCK ROUTES
   ========================================= */

// Seedha stock table mein manual entry ke liye
router.post("/", addStockItem); 

// Sabhi stocks fetch karne ke liye
router.get("/", getStocks);    

// Stock edit karne ke liye (ID ke through)
router.put("/:id", updateStock);       

// Stock permanent delete karne ke liye
router.delete("/:id", deleteStock);    

export default router;