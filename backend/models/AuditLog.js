// AuditLog.js
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    // Kis user ne action liya
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Kya kaam kiya (e.g., 'CREATE_SALE', 'DELETE_PURCHASE', 'UPDATE_STOCK')
    action: {
        type: String,
        required: true,
        uppercase: true
    },
    // Kis module mein badlav hua
    module: {
        type: String,
        required: true,
        enum: ['SALE', 'PURCHASE', 'STOCK', 'EXPENSE', 'STAFF', 'PARTY', 'USER'],
        uppercase: true
    },
    // Kis specific document par action hua (Sale ID or Product ID)
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    // Badlav se pahle kya data tha (Stringify karke store karenge)
    oldValue: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    // Badlav ke baad kya data hai
    newValue: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    // Additional Details
    ipAddress: String,
    deviceInfo: String,
    remark: {
        type: String,
        trim: true
    }
}, { 
    timestamps: { createdAt: true, updatedAt: false } // Sirf 'created' zaruri hai
});

// Indexing for faster admin searching
auditLogSchema.index({ module: 1, action: 1 });
auditLogSchema.index({ createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);