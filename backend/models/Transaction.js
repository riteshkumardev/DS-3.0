import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now,
        required: true
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
            'ADJUSTMENT' // Added for Freight and manual corrections
        ],
        required: true
    },
    description: {
        type: String,
        trim: true,
        uppercase: true 
    },
    // --- Accounting Logic (Standard Debit/Credit) ---
    debit: {
        type: Number,
        default: 0,
        set: v => Math.round(v * 100) / 100 // Decimal precision fix
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
    // referenceId: Can link to Sale, Purchase, or Expense ID
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

// Indexing: Optimized for Ledger History and Audit Trails
transactionSchema.index({ partyId: 1, date: -1 });
transactionSchema.index({ staffId: 1, date: -1 });
transactionSchema.index({ referenceId: 1 });
transactionSchema.index({ type: 1, date: -1 });

// Fix for Model Overwrite during Hot Reloading
const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

export default Transaction;