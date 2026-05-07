import express from "express";
const router = express.Router();
// Maan lete hain aapka controller file salaryController.js hai
import { getSalaryPaymentByBill } from "../controllers/salaryController.js";
import { protect } from "../middlewares/authMiddleware.js";


// Route define karein: /api/salary-payments/:billNo
router.route("/:billNo").get(protect, getSalaryPaymentByBill);

export default router;