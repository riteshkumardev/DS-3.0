import mongoose from 'mongoose';

// --- Goods Schema (Ledger ke andar item detail dikhane ke liye) ---
const goodsSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: "KG" },
    rate: { type: Number, required: true }
}, { _id: false });

const ledgerSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    billNo: { 
        type: String, 
        default: "-",
        uppercase: true 
    },
    // Related Entities
    partyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party',
        required: false 
    },
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: false
    },
    type: {
        type: String,
        enum: [
            'SALE', 'PURCHASE', 'PAYMENT_IN', 'PAYMENT_OUT', 
            'EXPENSE', 'SALARY', 'OPENING_BALANCE', 'REVERSAL',
            'ADJUSTMENT' 
        ],
        required: true
    },
    description: {
        type: String,
        trim: true,
        uppercase: true 
    },
    goods: [goodsSchema], 
    debit: {
        type: Number,
        default: 0,
        set: v => Math.round(v * 100) / 100 
    },
    credit: {
        type: Number,
        default: 0,
        set: v => Math.round(v * 100) / 100
    },
    runningBalance: {
        type: Number,
        default: 0
    },
    paymentMode: {
        type: String,
        enum: ['CASH', 'UPI', 'BANK', 'CREDIT', 'ADJUSTMENT', 'CHEQUE'],
        default: 'CREDIT'
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    }
}, {
    timestamps: true
});

// Indexes for performance
ledgerSchema.index({ partyId: 1, date: -1 });
ledgerSchema.index({ staffId: 1, date: -1 });
ledgerSchema.index({ billNo: 1 });

// ✅ IMPORTENT: Model ka naam "Ledger" hi rakhein taaki Controller sync ho jaye
const Ledger = mongoose.models.Ledger || mongoose.model("Ledger", ledgerSchema);

export default Ledger;