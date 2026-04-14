import mongoose from "mongoose";

/**
 * System Audit Log Schema
 * Tracks every sensitive action in the ERP
 */
const logSchema = new mongoose.Schema({
    module: {
        type: String,
        required: true,
        enum: ['AUTH', 'SALE', 'PURCHASE', 'STOCK', 'EXPENSE', 'PARTY', 'STAFF', 'LEDGER'],
        index: true
    },
    action: {
        type: String,
        required: true // e.g., 'CREATE_SALE', 'UPDATE_STOCK', 'DELETE_EXPENSE'
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the actual Bill/Transaction
        refPath: 'module' 
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed // JSON object containing old vs new values
    },
    ipAddress: String,
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED'],
        default: 'SUCCESS'
    }
}, { timestamps: true });

// Index for faster searching by date
logSchema.index({ createdAt: -1 });

const Log = mongoose.model("Log", logSchema);
export default Log;