import express from "express";
import { getPaymentHistory, addPayment } from "../controllers/salary.controller.js";

const router = express.Router();

router.get("/:id", getPaymentHistory);
router.post("/", addPayment);

export default router;