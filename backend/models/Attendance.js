// Attendance.js
import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: [true, "Staff reference is required"]
    },
    date: {
        type: Date,
        required: [true, "Date is required"],
        // Ek employee ki ek din mein ek hi attendance entry honi chahiye
    },
    status: {
        type: String,
        enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'PAID_LEAVE', 'HOLIDAY'],
        default: 'PRESENT',
        required: true
    },
    // Logistics/Agro business mein overtime bohot common hai
    overtimeHours: {
        type: Number,
        default: 0,
        min: 0
    },
    checkIn: {
        type: String, // e.g., "09:00 AM"
    },
    checkOut: {
        type: String, // e.g., "06:00 PM"
    },
    remark: {
        type: String,
        trim: true,
        uppercase: true // e.g., "LATE ENTRY", "FIELD WORK"
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { 
    timestamps: true 
});

// Compound Index: Ek hi staff ki same date par do entry na ho paye
attendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);