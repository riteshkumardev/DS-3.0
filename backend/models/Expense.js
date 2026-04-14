// Expense.js
import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
    date: { 
        type: Date, 
        required: [true, "Date is mandatory"],
        default: Date.now 
    },
    // Category specific details (Loading, Unloading, Rasan, etc.)
    category: {
        type: String,
        required: [true, "Expense category is required"],
        enum: [
            'LOADING', 'UNLOADING', 'RASAN', 'WATER', 'MEDICAL', 
            'CA', 'ELECTRICAL', 'HARDWARE', 'STATIONARY', 
            'CONSTRUCTION', 'FUEL', 'SALARY', 'OTHER'
        ],
        uppercase: true
    },
    // Agar 'OTHER' category hai to yahan detail aayegi
    otherDetail: {
        type: String,
        trim: true,
        uppercase: true
    },
    // Accounting Logic
    type: { 
        type: String, 
        required: true, 
        enum: ['PAYMENT_IN', 'PAYMENT_OUT'],
        default: 'PAYMENT_OUT'
    },
    amount: { 
        type: Number, 
        required: [true, "Amount is required"],
        min: [0, "Amount cannot be negative"] 
    },
    // Financial Tracking
    paymentMode: {
        type: String,
        enum: ['CASH', 'BANK', 'UPI', 'CHEQUE'],
        default: 'CASH',
        uppercase: true
    },
    txnId: { 
        type: String, 
        trim: true,
        uppercase: true,
        comment: 'Transaction ID / UTR No'
    },
    remark: { 
        type: String, 
        trim: true 
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { 
    timestamps: true 
});

// Search performance index
expenseSchema.index({ category: 1, date: -1 });

export default mongoose.model("Expense", expenseSchema);