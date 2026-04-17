import mongoose from 'mongoose';

// --- Goods Schema for Ledger Detail ---
// Isse Account Statement mein hi pata chal jayega ki kya product sell/buy hua tha
const goodsSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: "KG" },
    rate: { type: Number, required: true }
}, { _id: false });

const transactionSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    // --- Tracking (New v3) ---
    billNo: { 
        type: String, 
        default: "-",
        uppercase: true 
    },
    // --- Related Entity ---
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
    // --- Transaction Details ---
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
    // --- Goods Detail (For Product-wise Ledger) ---
    goods: [goodsSchema], // ✅ Added to store item details in ledger

    // --- Accounting Logic (Standard Debit/Credit) ---
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
    // --- Meta Data ---
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for easy identification of IN/OUT for UI
transactionSchema.virtual('nature').get(function() {
    if (this.debit > 0) return 'DEBIT';
    if (this.credit > 0) return 'CREDIT';
    return 'NEUTRAL';
});

// --- Indexes: Optimized for Fast Ledger Loading ---
transactionSchema.index({ partyId: 1, date: -1, createdAt: -1 }); // Multi-level sort index
transactionSchema.index({ staffId: 1, date: -1 });
transactionSchema.index({ referenceId: 1 });
transactionSchema.index({ billNo: 1 }); // Search by bill number

const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

export default Transaction;