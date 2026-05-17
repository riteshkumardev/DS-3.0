import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
    // --- Unique Identification ---
    employeeId: { 
        type: String, 
        unique: true,
        uppercase: true,
        trim: true
        // Frontend Controller automation ke liye required hata diya gaya hai
    },
    name: { 
        type: String, 
        required: [true, "Name is mandatory"], 
        trim: true, 
        uppercase: true 
    },
    fatherName: { type: String, trim: true, uppercase: true }, 
    role: { 
        type: String, 
        enum: ['MANAGER', 'ACCOUNTANT', 'DRIVER', 'LOADER', 'SALES_MAN', 'OPERATOR', 'WORKER', 'OTHER'],
        default: 'WORKER' // Fallback to WORKER to match dropdown
    },
    
    // --- Contact & Personal Details ---
    phone: { 
        type: String, 
        required: [true, "Phone number is required"],
        unique: true,
        trim: true
    },
    emergencyPhone: { type: String, trim: true }, 
    address: { type: String, trim: true }, 
    
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
    password: { 
        type: String, 
        required: [true, "Access PIN/Password is required"] 
    },

    // --- Banking & KYC ---
    kycDetails: {
        aadharNumber: { type: String, trim: true },
        panNumber: { type: String, trim: true, uppercase: true }
    },
    bankDetails: {
        accountNumber: { type: String, trim: true },
        ifscCode: { type: String, uppercase: true, trim: true },
        bankName: { type: String, trim: true }
    },

    // --- Performance & Ledger Link ---
    currentBalance: {
        type: Number,
        default: 0,
        comment: "Tracks real-time transactional offset (Negative: Advance, Positive: Payable)"
    }
}, { 
    timestamps: true 
});

// Fast indexing for lookups and credentials verification
staffSchema.index({ employeeId: 1, phone: 1 });
staffSchema.index({ status: 1 });

/**
 * 🚀 CRITICAL FIX: Safe auto-generation mechanism to avoid compilation error.
 * Use 'this.constructor' instead of calling mongoose.model('Staff') directly.
 */
staffSchema.pre('save', async function (next) {
    if (!this.employeeId) {
        try {
            const year = new Date().getFullYear();
            // this.constructor dynamic target model ko reference karta hai bina execution circular loops ke
            const count = await this.constructor.countDocuments();
            this.employeeId = `DS-${year}-${(count + 1).toString().padStart(3, '0')}`;
        } catch (err) {
            return next(err);
        }
    }
    next();
});

export default mongoose.model('Staff', staffSchema);