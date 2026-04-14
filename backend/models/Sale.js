// Sale.js
import mongoose from "mongoose";

const goodsSchema = new mongoose.Schema({
    // Ab String ki jagah Product Model ka reference use karein
    productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
    },
    productName: { type: String, required: true }, // Snaphot for Invoice printing
    hsn: { type: String },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "KG" },
    rate: { type: Number, required: true, min: 0 },
    taxableAmount: { type: Number, default: 0 }
}, { _id: false });

const saleSchema = new mongoose.Schema({
    // Business Identification
    billNo: { 
        type: String, 
        required: true, 
        unique: true,
        uppercase: true 
    },
    date: { type: Date, default: Date.now },
    
    // Customer Linking (Critical for Ledger)
    partyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Party', 
        required: true 
    },
    customerName: { type: String, required: true }, // Redundancy for fast display
    
    // Grouped Logistics (Truck/Dispatch details)
    logistics: {
        vehicleNo: { type: String, uppercase: true },
        dispatchedThrough: { type: String, uppercase: true },
        destination: { type: String, uppercase: true },
        lrRrNo: { type: String },
        freight: { type: Number, default: 0 },
        isFreightPaid: { type: Boolean, default: false }
    },

    // Optional Fields (Cleaned up)
    buyerOrderNo: { type: String },
    termsOfDelivery: { type: String },

    // Items List
    goods: [goodsSchema],

    // --- Financials (Automated) ---
    subTotal: { type: Number, default: 0 }, // Total of all items before Tax & Freight
    gstType: { type: String, enum: ['CGST/SGST', 'IGST'], required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    
    discount: { type: Number, default: 0 }, // Cash Discount (Flat)
    roundOff: { type: Number, default: 0 },
    
    grandTotal: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 }, // Real-time payment entry
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

// --- High-Level Auto Calculations ---
saleSchema.pre("save", function (next) {
    // 1. Calculate Taxable amount for each item
    this.subTotal = this.goods.reduce((sum, item) => {
        item.taxableAmount = item.quantity * item.rate;
        return sum + item.taxableAmount;
    }, 0);

    // 2. Tax Calculation Logic
    const totalTaxes = this.cgst + this.sgst + this.igst;
    
    // 3. Grand Total = SubTotal + Taxes + Freight - Discount + RoundOff
    this.grandTotal = (this.subTotal + totalTaxes + this.logistics.freight + this.roundOff) - this.discount;
    
    // 4. Calculate Balance Due
    this.balanceDue = this.grandTotal - this.amountPaid;

    // 5. Update Payment Status
    if (this.balanceDue <= 0) {
        this.status = 'PAID';
    } else if (this.balanceDue < this.grandTotal) {
        this.status = 'PARTIAL';
    } else {
        this.status = 'UNPAID';
    }

    next();
});

export default mongoose.model("Sale", saleSchema);