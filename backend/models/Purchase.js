import mongoose from "mongoose";

// Reuse the same goods structure for consistency
const purchaseGoodsSchema = new mongoose.Schema({
  product: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  taxableAmount: { type: Number, default: 0 },
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  billNo: { type: String, required: true }, // Supplier's Invoice No
  date: { type: String, required: true },
  supplierName: { type: String, required: true },
  gstin: { type: String, default: "N/A" }, 
  mobile: { type: String }, 
  address: { type: String },
  vehicleNo: { type: String }, 

  // Multi-item Support
  goods: [purchaseGoodsSchema],

  // Financials
  travelingCost: { type: Number, default: 0 }, // Same as Freight
  taxableValue: { type: Number, default: 0 },
  cashDiscount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true }, // Grand Total
  paidAmount: { type: Number, default: 0 },    // Yeh hamara "DEBIT" transaction banega
  balanceAmount: { type: Number, default: 0 },
  
  remarks: { type: String }
}, { timestamps: true });

// Auto-calculation for Purchase
purchaseSchema.pre("save", function (next) {
  this.taxableValue = this.goods.reduce((sum, g) => {
    g.taxableAmount = (Number(g.quantity) || 0) * (Number(g.rate) || 0);
    return sum + g.taxableAmount;
  }, 0);

  this.totalAmount = (this.taxableValue + Number(this.travelingCost)) - (Number(this.cashDiscount) || 0);
  this.balanceAmount = this.totalAmount - (Number(this.paidAmount) || 0);
  next();
});

export default mongoose.model("Purchase", purchaseSchema);