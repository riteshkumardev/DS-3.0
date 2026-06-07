import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
    // --- Unique Identification ---
    employeeId: { 
        type: String, 
        unique: true,
        uppercase: true,
        trim: true
        // Frontend & Middleware tracking automation ke liye automated hook setup hai
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
        default: 'WORKER' 
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
    photo: { type: String, default: null }, // Fixed: Photo storage node parameter link added

    // --- Employment & Security Config ---
    joiningDate: { type: Date, default: Date.now },
    leftDate: { type: Date, default: null },
    status: { 
        type: String, 
        enum: ['ACTIVE', 'ON_LEAVE', 'LEFT', 'TERMINATED'], 
        default: 'ACTIVE' 
    },
    isBlocked: { 
        type: Boolean, 
        default: false // Fixed: Controller authorization locks support enabled
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
    },
    
    // --- Session Handshake Control ---
    currentSessionId: {
        type: String,
        default: null
    }
}, { 
    timestamps: true 
});

// Fast indexing for optimize dashboard performance lookups
staffSchema.index({ employeeId: 1, phone: 1 });
staffSchema.index({ status: 1 });

/**
 * 🚀 BULLETPROOF FIX: Auto-Sequence ID Generator
 * Count engine ke bajay ye database me se highest incremental sequence ID fetch karega
 * taaki document delete hone ke baad bhi code collision/duplicate runtime error na de.
 */
staffSchema.pre('save', async function (next) {
    // Only generate if employeeId doesn't exist yet
    if (!this.employeeId) {
        try {
            const year = new Date().getFullYear();
            const prefix = `DS-${year}-`;

            // Find the latest staff created for the current year
            const latestStaff = await this.constructor.findOne(
                { employeeId: new RegExp(`^${prefix}`) },
                { employeeId: 1 },
                { sort: { employeeId: -1 } }
            );

            let nextSequence = 1;
            if (latestStaff && latestStaff.employeeId) {
                // Last 3 digits extract karke increment karein
                const lastSequenceText = latestStaff.employeeId.replace(prefix, "");
                const parsedSequence = parseInt(lastSequenceText, 10);
                if (!isNaN(parsedSequence)) {
                    nextSequence = parsedSequence + 1;
                }
            }

            this.employeeId = `${prefix}${nextSequence.toString().padStart(3, '0')}`;
        } catch (err) {
            return next(err);
        }
    }
    next();
});

export default mongoose.model('Staff', staffSchema);