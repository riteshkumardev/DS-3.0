import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
    // --- Unique Identification ---
    employeeId: { 
        type: String, 
        unique: true,
        uppercase: true,
        trim: true
        // 'required' hata diya hai kyunki hum ise save hone se pehle backend me generate karenge
    },
    name: { 
        type: String, 
        required: [true, "Name is mandatory"], 
        trim: true, 
        uppercase: true 
    },
    fatherName: { type: String, trim: true, uppercase: true }, // Added from your JSON
    role: { 
        type: String, 
        enum: ['MANAGER', 'ACCOUNTANT', 'DRIVER', 'LOADER', 'SALES_MAN', 'OPERATOR',"WORKER" ,'OTHER'],
        default: 'OPERATOR'
    },
    
    // --- Contact & Personal Details ---
    phone: { 
        type: String, 
        required: [true, "Phone number is required"],
        unique: true,
        trim: true
    },
    emergencyPhone: { type: String, trim: true }, // Added from your JSON
    address: { type: String, trim: true }, // Simplified to match your input
    
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
    password: { type: String, required: true }, // Added for Login/Ledger access

    // --- Banking & KYC ---
    kycDetails: {
        aadharNumber: { type: String, trim: true },
        panNumber: { type: String, trim: true, uppercase: true }
    },
    bankDetails: {
        accountNumber: { type: String },
        ifscCode: { type: String, uppercase: true },
        bankName: { type: String }
    },

    // --- Performance & Ledger Link ---
    currentBalance: {
        type: Number,
        default: 0,
        comment: "Negative means advance, Positive means payable salary"
    }
}, { 
    timestamps: true 
});

// --- Middleware: Auto-generate Employee ID before saving ---
staffSchema.pre('save', async function (next) {
    if (!this.employeeId) {
        // Logic: DS-2026-001 (Example)
        const year = new Date().getFullYear();
        const count = await mongoose.model('Staff').countDocuments();
        this.employeeId = `DS-${year}-${(count + 1).toString().padStart(3, '0')}`;
    }
    next();
});

staffSchema.index({ employeeId: 1, phone: 1 });

export default mongoose.model('Staff', staffSchema);