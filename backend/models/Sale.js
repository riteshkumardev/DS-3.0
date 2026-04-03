import mongoose from "mongoose";

const goodsSchema = new mongoose.Schema({
  product: { type: String, required: true },
  hsn: { type: String },
  quantity: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  taxableAmount: { type: Number, default: 0 },
}, { _id: false });

const saleSchema = new mongoose.Schema({
  billNo: { type: String, 
    required: true,
    unique: true },
  date: { type: String, required: true },
  customerName: { type: String, required: true },
  gstin: { type: String },
  mobile: { type: String },
  address: { type: String },
  vehicleNo: { type: String },
  
  // Professional Fields
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

  // Flat fields for backend logic
  productName: { type: String },
  quantity: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  goods: [goodsSchema],

  // Financials
  freight: { type: Number, default: 0 },
  taxableValue: { type: Number, default: 0 },
  cashDiscount: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  amountReceived: { type: Number, default: 0 },
  paymentDue: { type: Number, default: 0 },

  remarks: { type: String },
  si: { type: Number }
}, { timestamps: true });

saleSchema.pre("save", function (next) {
  // 1. Goods Array Sync: Agar goods khali hai toh productName/qty se bharo
  if ((!this.goods || this.goods.length === 0) && this.productName) {
    this.goods = [{
      product: this.productName,
      quantity: Number(this.quantity) || 0,
      rate: Number(this.rate) || 0,
      taxableAmount: (Number(this.quantity) || 0) * (Number(this.rate) || 0)
    }];
  }

  // 2. Calculation Logic
  this.taxableValue = this.goods.reduce((sum, g) => {
    g.taxableAmount = (Number(g.quantity) || 0) * (Number(g.rate) || 0);
    return sum + g.taxableAmount;
  }, 0);

  const discount = (this.taxableValue * (Number(this.cashDiscount) || 0)) / 100;
  
  // Tax (CGST/SGST 0 as per your requirement currently)
  this.totalAmount = this.taxableValue + (Number(this.freight) || 0) - discount;
  this.paymentDue = this.totalAmount - (Number(this.amountReceived) || 0);

  next();
});

export default mongoose.model("Sale", saleSchema);