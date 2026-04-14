import express from "express";
import {
  addPurchase,
  getPurchases,
  updatePurchase,
  deletePurchase
} from "../controllers/purchase.controller.js";

const router = express.Router();

// ✅ PURCHASE APIs
router.get("/", getPurchases);        // GET /api/purchases
router.post("/", addPurchase);        // POST /api/purchases
router.put("/:id", updatePurchase);   // PUT /api/purchases/:id
router.delete("/:id", deletePurchase);// DELETE /api/purchases/:id

export default router;
