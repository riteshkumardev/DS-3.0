import express from "express";
import {
  addSale,
  getSales,
  deleteSale,
  updateSale,
  getLatestBillNo,
  migrateSalesData 
} from "../controllers/sales.controller.js";

const router = express.Router();

/**
 * @route   GET /api/sales/latest-bill-no
 * @desc    Naya Bill Number generate karne ke liye
 */
router.get("/latest-bill-no", getLatestBillNo);

/**
 * @route   GET /api/sales/fix-database-data
 * @desc    Purane records ko naye professional schema mein migrate karne ke liye
 */
router.get("/fix-database-data", migrateSalesData);

/**
 * @route   POST /api/sales
 * @desc    Nayi sale save karna aur stock adjust karna
 */
router.post("/", addSale);

/**
 * @route   GET /api/sales
 * @desc    Saari sales list fetch karna
 */
router.get("/", getSales);

/**
 * @route   PUT /api/sales/:id
 * @desc    Existing sale update karna aur stock re-calculate karna
 */
router.put("/:id", updateSale);

/**
 * @route   DELETE /api/sales/:id
 * @desc    Sale delete karna aur stock wapas add karna
 */
router.delete("/:id", deleteSale);

export default router;