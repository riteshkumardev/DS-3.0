// Purchase.js
import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema({
    productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
    },
    productName: { type: String, required: true }, // Snapshot for record
    hsn: { type: String },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "KG" },
    rate: { type: Number, required: true, min: 0 }, // Cost Price
    taxableAmount: { type: Number, default: 0 }
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
    // Business Identification
    billNo: { 
        type: String, 
        required: true, 
        uppercase: true,
        comment: 'Supplier ka invoice number'
    },
    purchaseDate: { type: Date, default: Date.now },
    
    // Supplier Linking (Critical for Creditors Ledger)
    supplierId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Party', // Party model mein partyType: 'SUPPLIER' filter hoga
        required: true 
    },
    supplierName: { type: String, required: true },

    // Items List
    items: [purchaseItemSchema],

    // --- Financials (Automated) ---
    subTotal: { type: Number, default: 0 }, 
    gstType: { type: String, enum: ['CGST/SGST', 'IGST'], required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    
    otherCharges: { type: Number, default: 0, comment: 'Extra costs like unloading' },
    discount: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    
    grandTotal: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 }, // Kitna cash/bank se diya
    balanceDue: { type: Number, default: 0 }, // Supplier ko kitna dena baaki hai

    paymentStatus: { 
        type: String, 
        enum: ['PAID', 'PARTIAL', 'UNPAID'], 
        default: 'UNPAID' 
    },

    performedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    remarks: { type: String, trim: true }
}, { timestamps: true });

// --- Auto Calculations for Purchase ---
purchaseSchema.pre("save", function (next) {
    // 1. Calculate Taxable amount for each item
    this.subTotal = this.items.reduce((sum, item) => {
        item.taxableAmount = item.quantity * item.rate;
        return sum + item.taxableAmount;
    }, 0);

    // 2. Total calculation
    const totalTaxes = this.cgst + this.sgst + this.igst;
    this.grandTotal = (this.subTotal + totalTaxes + this.otherCharges + this.roundOff) - this.discount;
    
    // 3. Balance Due (Liability)
    this.balanceDue = this.grandTotal - this.amountPaid;

    // 4. Update Status
    if (this.balanceDue <= 0) {
        this.paymentStatus = 'PAID';
    } else if (this.balanceDue < this.grandTotal) {
        this.paymentStatus = 'PARTIAL';
    } else {
        this.paymentStatus = 'UNPAID';
    }

    next();
});

export default mongoose.model("Purchase", purchaseSchema);