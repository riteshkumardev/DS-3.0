import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    // 👤 Kis user ya staff ne action liya (Stored as raw ObjectId for multi-collection flexibility)
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
        // 🎯 Note: Yahan se rigid ref: 'User' isliye hataya hai taaki 'Staff' ya 'User' dono ki IDs bina cross-validation tute save ho sakein
    },
    
    // ⚡ Kya kaam kiya (e.g., 'CREATE_SALE', 'DELETE_PURCHASE', 'PASSWORD_CHANGE')
    action: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    
    // 📦 Kis module mein badlav hua
    module: {
        type: String,
        required: true,
        uppercase: true,
        // 🔥 FIXED THE BUG: Added 'SECURITY', 'PROFILE', and 'SYSTEM' to the valid enum list
        enum: ['SALE', 'PURCHASE', 'STOCK', 'EXPENSE', 'STAFF', 'PARTY', 'USER', 'PROFILE', 'SECURITY', 'SYSTEM']
    },
    
    // 🎯 Kis specific document par action hua (Sale ID, Product ID, Employee ID, or User ID)
    // Fixed: Standardized to String to accept alphanumeric custom formats (e.g., DS-2026-001) or regular ObjectIds safely
    documentId: {
        type: String,
        required: false,
        trim: true
    },
    
    // ⏳ Badlav se pahle kya data tha (Stringify/Object payload chunk mapping)
    oldValue: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    
    // 🚀 Badlav ke baad kya data hai
    newValue: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    
    // 🌐 Network & Device Footprints
    ipAddress: {
        type: String,
        default: "UNKNOWN"
    },
    deviceInfo: {
        type: String,
        default: "UNKNOWN"
    },
    
    // 📝 Additional Meta Remarks
    remark: {
        type: String,
        trim: true
    }
}, { 
    timestamps: { createdAt: true, updatedAt: false } // Only 'createdAt' is required for core auditing logs
});

// Indexing for faster admin searching and dashboard loading performance
auditLogSchema.index({ module: 1, action: 1 });
auditLogSchema.index({ performedBy: 1 }); // Added index for rapid trace lookups of individual staff members
auditLogSchema.index({ createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);