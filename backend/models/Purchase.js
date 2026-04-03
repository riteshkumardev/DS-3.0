import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  date: { type: String, required: true },
  supplierName: { type: String, required: true },
  
  // 🆕 Naye fields jo auto-fill dropdown se aayenge
  gstin: { type: String, required: false, default: "N/A" }, 
  mobile: { type: String, required: false }, 
  address: { type: String, required: false },

  productName: { type: String, required: true },
  billNo: { type: String, required: false },
  vehicleNo: { type: String, required: false }, 
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  travelingCost: { type: Number, default: 0 }, 
  cashDiscount: { type: Number, default: 0 },   
  
  totalAmount: { type: Number, required: true }, 
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  remarks: { type: String }
}, { timestamps: true });

export default mongoose.model("Purchase", purchaseSchema);