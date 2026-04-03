import mongoose from "mongoose";

const goodsSchema = new mongoose.Schema({
  product: { type: String, required: true },
  hsn: { type: String },
  quantity: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  taxableAmount: { type: Number, default: 0 },
}, { _id: false });

const saleSchema = new mongoose.Schema({
  billNo: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  customerName: { type: String, required: true },
  gstin: { type: String, default: "N/A" },
  mobile: { type: String },
  address: { type: String },
  vehicleNo: { type: String },
  
  // Professional Logistics Fields
  deliveryNote: { type: String },
  paymentMode: { type: String, default: "BY BANK" },
  buyerOrderNo: { type: String },
  buyerOrderDate: { type: String, default: "-" },
  dispatchDocNo: { type: String },
  dispatchDate: { type: String, default: "-" },
  dispatchedThrough: { type: String },
  destination: { type: String },
  lrRrNo: { type: String },
  termsOfDelivery: { type: String },

  // Items
  goods: [goodsSchema],

  // Financials (Fixed Logic)
  freight: { type: Number, default: 0 },
  taxableValue: { type: Number, default: 0 },
  cashDiscount: { type: Number, default: 0 }, // Percentage or Flat (Hum yahan Flat treat kar rahe hain)
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 }, // Grand Total
  amountReceived: { type: Number, default: 0 }, // Yeh hamara "CREDIT" transaction banega
  paymentDue: { type: Number, default: 0 },

  remarks: { type: String },
  si: { type: Number }
}, { timestamps: true });

// Auto-calculation before saving
saleSchema.pre("save", function (next) {
  this.taxableValue = this.goods.reduce((sum, g) => {
    g.taxableAmount = (Number(g.quantity) || 0) * (Number(g.rate) || 0);
    return sum + g.taxableAmount;
  }, 0);

  // Formula: (Taxable + Freight + Taxes) - Discount
  const totalTaxes = (Number(this.cgst) || 0) + (Number(this.sgst) || 0) + (Number(this.igst) || 0);
  this.totalAmount = (this.taxableValue + Number(this.freight) + totalTaxes) - (Number(this.cashDiscount) || 0);
  
  this.paymentDue = this.totalAmount - (Number(this.amountReceived) || 0);
  next();
});

export default mongoose.model("Sale", saleSchema);