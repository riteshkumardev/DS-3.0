import express from "express";
import { 
  createSupplier, 
  getAllSuppliers, 
  updateSupplier, 
  deleteSupplier 
} from "../controllers/supplier.controller.js";

const router = express.Router();

router.post("/add", createSupplier);
router.get("/list", getAllSuppliers);
// Update route add karein
router.put("/update/:id", updateSupplier);
router.delete("/delete/:id", deleteSupplier);

export default router;