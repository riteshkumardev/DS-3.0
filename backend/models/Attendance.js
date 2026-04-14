import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    // --- Link to Staff Master ---
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: [true, "Staff reference is required"]
    },
    // Frontend compatibility ke liye hum employeeId (DS-2026-001) bhi store kar sakte hain
    employeeId: { 
        type: String, 
        required: true,
        uppercase: true 
    },

    // --- Date & Time ---
    // String format (YYYY-MM-DD) is safer for daily reports in India timezone
    date: {
        type: String, 
        required: [true, "Attendance date is required"]
    },
    checkIn: { type: String },  // "09:00 AM"
    checkOut: { type: String }, // "06:30 PM"

    // --- Status & Payroll Triggers ---
    status: {
        type: String,
        enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'PAID_LEAVE', 'HOLIDAY', 'SUNDAY'],
        default: 'PRESENT',
        required: true
    },
    
    // Dharashakti Agro mein Overtime management
    overtimeHours: {
        type: Number,
        default: 0,
        min: 0
    },

    // --- Logistics Specific ---
    workLocation: {
        type: String,
        enum: ['OFFICE', 'WAREHOUSE', 'FIELD_STATION', 'ON_TRIP'],
        default: 'WAREHOUSE'
    },

    // --- Audit & Notes ---
    remark: {
        type: String,
        trim: true,
        uppercase: true // "FIELD WORK", "LATE DUE TO RAIN"
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId, // Admin ya Manager ki ID
        ref: 'User',
        required: true
    }
}, { 
    timestamps: true 
});

// CRITICAL: Prevent duplicate entries for the same person on the same day
attendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, status: 1 }); // For fast daily reports

export default mongoose.model('Attendance', attendanceSchema);