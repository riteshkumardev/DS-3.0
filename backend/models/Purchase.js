import mongoose from "mongoose";

// 🔧 Safe Number Helper
const toNumber = (val) => (isNaN(Number(val)) ? 0 : Number(val));

const goodsSchema = new mongoose.Schema({
    productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
    },
    productName: { type: String, required: true },
    hsn: { type: String },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "KG" },
    rate: { type: Number, required: true, min: 0 },
    taxableAmount: { type: Number, default: 0 }
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
    // Business Identification (Exactly like Sale)
    billNo: { 
        type: String, 
        required: true, 
        unique: true, // Ensuring unique purchase bills
        uppercase: true 
    },
    date: { type: Date, default: Date.now },
    
    // Party Linking (Critical for Ledger)
    partyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Party', 
        required: true 
    },
    customerName: { type: String, required: true }, // Name kept as 'customerName' to match Sale Schema
    
    // Grouped Logistics (Matched with Sale)
    logistics: {
        vehicleNo: { type: String, uppercase: true },
        dispatchedThrough: { type: String, uppercase: true },
        destination: { type: String, uppercase: true },
        lrRrNo: { type: String },
        freight: { type: Number, default: 0 },
        isFreightPaid: { type: Boolean, default: false }
    },

    // Reference Fields
    buyerOrderNo: { type: String }, // Can be used for Supplier Order No
    termsOfDelivery: { type: String },

    // Items List
    goods: [goodsSchema],

    // --- Financials (Exactly like Sale) ---
    subTotal: { type: Number, default: 0 }, 
    gstType: { type: String, enum: ['CGST/SGST', 'IGST'], required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    
    discount: { type: Number, default: 0 }, 
    roundOff: { type: Number, default: 0 },
    
    grandTotal: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 }, 
    balanceDue: { type: Number, default: 0 },

    status: { 
        type: String, 
        enum: ['PAID', 'PARTIAL', 'UNPAID', 'CANCELLED'], 
        default: 'UNPAID' 
    },
    
    performedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    remarks: { type: String, trim: true }
}, { timestamps: true });

// --- High-Level Auto Calculations (Matched with Sale) ---
purchaseSchema.pre("save", function (next) {
    
    // 1. Calculate Taxable amount for each item & SubTotal
    this.subTotal = this.goods.reduce((sum, item) => {
        const qty = toNumber(item.quantity);
        const rate = toNumber(item.rate);
        item.taxableAmount = qty * rate;
        return sum + item.taxableAmount;
    }, 0);

    // 2. Tax Calculation Logic
    const totalTaxes = toNumber(this.cgst) + toNumber(this.sgst) + toNumber(this.igst);
    
    // 3. Grand Total = SubTotal + Taxes + Freight + RoundOff - Discount
    // Using the same formula as Sale for consistency
    this.grandTotal = Math.round(
        (this.subTotal + totalTaxes + toNumber(this.logistics.freight) + toNumber(this.roundOff)) - toNumber(this.discount)
    );
    
    // 4. Calculate Balance Due
    this.amountPaid = toNumber(this.amountPaid);
    this.balanceDue = this.grandTotal - this.amountPaid;

    // 5. Update Payment Status (Same logic as Sale)
    if (this.balanceDue <= 0) {
        this.status = 'PAID';
    } else if (this.balanceDue < this.grandTotal) {
        this.status = 'PARTIAL';
    } else {
        this.status = 'UNPAID';
    }

    next();
});

export default mongoose.model("Purchase", purchaseSchema);