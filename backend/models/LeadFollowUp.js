import mongoose from "mongoose";

const leadFollowUpSchema = new mongoose.Schema({
    partyName: {
        type: String,
        required: [true, "Party name is required"],
        trim: true,
        uppercase: true
    },
    mobileNumber: {
        type: String,
        trim: true,
        default: "N/A"
    },
    address: {
        type: String,
        trim: true,
        uppercase: true
    },
    remarks: {
        type: String,
        required: [true, "Remarks/Action item is required"],
        trim: true,
        uppercase: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'ORDER_RECEIVED', 'CALLBACK_REQUIRED', 'COMPLAINT_RESOLVED', 'NO_REQUIREMENT'],
        default: 'PENDING',
        uppercase: true
    },
    // 🚀 CRITICAL DATE FOR ALERTS: Is date par dashboard alert karega
    followUpDate: {
        type: Date,
        required: [true, "Follow-up date or timeline is required"]
    },
    // Special action filters (Jaise Dilraj ji ke case me 'गाड़ी उधर जाएगी tab checklist dikhana')
    actionTrigger: {
        type: String,
        enum: ['DATE_BASED', 'VEHICLE_ROUTE_BASED', 'IMMEDIATE'],
        default: 'DATE_BASED'
    },
    routeLocation: {
        type: String, // Jaise "LAKHISARAI" ya "DUMKA" taaki vehicle route filter ho sake
        trim: true,
        uppercase: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Kis admin/salesman ne follow-up record kiya
    }
}, { 
    timestamps: true 
});

// Optimization performance lookups ke liye indexes
leadFollowUpSchema.index({ followUpDate: 1, status: 1 });
leadFollowUpSchema.index({ partyName: 1 });

export default mongoose.model('LeadFollowUp', leadFollowUpSchema);