import mongoose from "mongoose";

// 🔧 Helper
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
    // ✅ SAME AS SALE
    billNo: { 
        type: String, 
        required: true, 
        uppercase: true,
    },

    date: { type: Date, default: Date.now }, // ✅ FIXED

    // ✅ SAME AS SALE
    partyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Party',
        required: true 
    },

    customerName: { type: String, required: true }, // ✅ FIXED

    // ✅ SAME STRUCTURE AS SALE
    logistics: {
        vehicleNo: { type: String, uppercase: true },
        dispatchedThrough: { type: String, uppercase: true },
        destination: { type: String, uppercase: true },
        lrRrNo: { type: String },
        freight: { type: Number, default: 0 },
        isFreightPaid: { type: Boolean, default: false }
    },

    // ✅ MAIN FIELD
    goods: [goodsSchema],

    // ⚠️ OLD SUPPORT
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
    
    discount: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    
    grandTotal: { type: Number, default: 0 },

    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },

    // ✅ SAME AS SALE
    status: { 
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


// 🔥 AUTO CALCULATION (MATCHED WITH SALE)
purchaseSchema.pre("save", function (next) {

    // ✅ BACKWARD SUPPORT
    if ((!this.goods || this.goods.length === 0) && this.items?.length > 0) {
        this.goods = this.items;
    }

    if (!Array.isArray(this.goods)) this.goods = [];

    // 1. SubTotal
    this.subTotal = this.goods.reduce((sum, item) => {
        const qty = toNumber(item.quantity);
        const rate = toNumber(item.rate);

        item.taxableAmount = qty * rate;

        return sum + item.taxableAmount;
    }, 0);

    // 2. Tax
    const totalTaxes =
        toNumber(this.cgst) +
        toNumber(this.sgst) +
        toNumber(this.igst);

    // 3. Freight (same as Sale)
    const freight = toNumber(this.logistics?.freight);

    // 4. Grand Total (🔥 SAME FORMULA)
    this.grandTotal =
        (this.subTotal + totalTaxes + freight + toNumber(this.roundOff))
        - toNumber(this.discount);

    // 5. Balance
    this.amountPaid = toNumber(this.amountPaid);
    this.balanceDue = this.grandTotal - this.amountPaid;

    // 6. Status
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