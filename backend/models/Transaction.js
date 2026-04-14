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
            'EXPENSE', 'SALARY', 'OPENING_BALANCE'
        ],
        required: true
    },
    description: {
        type: String,
        trim: true,
        uppercase: true 
    },
    // --- Accounting Logic (Debit/Credit) ---
    debit: {
        type: Number,
        default: 0
    },
    credit: {
        type: Number,
        default: 0
    },
    runningBalance: {
        type: Number,
        default: 0
    },
    // --- Meta Data ---
    paymentMode: {
        type: String,
        enum: ['CASH', 'UPI', 'BANK', 'CREDIT'],
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

// Indexing for faster reporting
transactionSchema.index({ date: -1, partyId: 1 });
transactionSchema.index({ type: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;