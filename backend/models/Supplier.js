import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  gstin: { type: String },
  phone: { type: String }, // Mobile No
  address: { type: String },
  previousBalance: { type: Number, default: 0 },
  currentBillsTotal: { type: Number, default: 0 },
  totalOwed: { type: Number, default: 0 },
  lastBillNo: { type: String }, // Bill Number
  lastBillDate: { type: Date }  // ✨ Bill Date as Date Object
}, { timestamps: true });

const Supplier = mongoose.model("Supplier", supplierSchema);
export default Supplier;