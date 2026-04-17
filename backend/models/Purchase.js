import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema({
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
    // Business Identification
    billNo: { 
        type: String, 
        required: true, 
        uppercase: true,
    },

    purchaseDate: { type: Date, default: Date.now },
    
    // Supplier Linking
    supplierId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Party',
        required: true 
    },

    supplierName: { type: String, required: true },

    // ✅ NEW STANDARD FIELD
    goods: [purchaseItemSchema],

    // ❗ OLD FIELD (for backward compatibility - optional remove later)
    items: { type: Array, select: false },

    // --- Financials ---
    subTotal: { type: Number, default: 0 },

    gstType: { 
        type: String, 
        enum: ['CGST/SGST', 'IGST'], 
        required: true 
    },

    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    
    otherCharges: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    
    grandTotal: { type: Number, default: 0 },

    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },

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


// 🔥 --- AUTO CALCULATIONS ---
purchaseSchema.pre("save", function (next) {

    // ✅ BACKWARD COMPATIBILITY (IMPORTANT)
    if ((!this.goods || this.goods.length === 0) && this.items?.length > 0) {
        this.goods = this.items;
    }

    // 1. Calculate Subtotal
    this.subTotal = (this.goods || []).reduce((sum, item) => {
        item.taxableAmount = item.quantity * item.rate;
        return sum + item.taxableAmount;
    }, 0);

    // 2. Tax Calculation
    const totalTaxes = this.cgst + this.sgst + this.igst;

    // 3. Grand Total
    this.grandTotal =
        (this.subTotal + totalTaxes + this.otherCharges + this.roundOff) 
        - this.discount;

    // 4. Balance Due
    this.balanceDue = this.grandTotal - this.amountPaid;

    // 5. Payment Status
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