// Staff.js
import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
    // --- Unique Identification ---
    employeeId: { 
        type: String, 
        required: [true, "Employee ID is required"], 
        unique: true,
        uppercase: true,
        trim: true,
        placeholder: "e.g., DS-EMP-001"
    },
    name: { 
        type: String, 
        required: [true, "Name is mandatory"], 
        trim: true, 
        uppercase: true 
    },
    role: { 
        type: String, 
        enum: ['MANAGER', 'ACCOUNTANT', 'DRIVER', 'LOADER', 'SALES_MAN', 'OPERATOR', 'OTHER'],
        default: 'OPERATOR'
    },
    
    // --- Contact & Personal Details ---
    phone: { 
        type: String, 
        required: [true, "Phone number is required"],
        unique: true,
        trim: true
    },
    alternatePhone: { type: String, trim: true },
    address: {
        street: String,
        city: { type: String, default: 'Samastipur' },
        state: { type: String, default: 'Bihar' }
    },
    
    // --- Employment & Salary Config ---
    joiningDate: { type: Date, default: Date.now },
    status: { 
        type: String, 
        enum: ['ACTIVE', 'ON_LEAVE', 'LEFT', 'TERMINATED'], 
        default: 'ACTIVE' 
    },
    baseSalary: { 
        type: Number, 
        required: [true, "Base salary is required"],
        min: 0
    },
    salaryType: {
        type: String,
        enum: ['MONTHLY', 'DAILY_WAGES'],
        default: 'MONTHLY'
    },

    // --- Banking & KYC (Critical for Professional Setup) ---
    kycDetails: {
        aadharNumber: { type: String, trim: true },
        panNumber: { type: String, trim: true, uppercase: true }
    },
    bankDetails: {
        accountHolderName: String,
        accountNumber: String,
        ifscCode: { type: String, uppercase: true },
        bankName: String
    },

    // --- Performance Tracking ---
    currentBalance: {
        type: Number,
        default: 0,
        comment: "Tracks Advance taken (-) or Salary due (+)"
    },
    
    remarks: { type: String, trim: true }
}, { 
    timestamps: true 
});

// Indexing for faster searching
staffSchema.index({ employeeId: 1, phone: 1 });
staffSchema.index({ status: 1 });

export default mongoose.model('Staff', staffSchema);