import mongoose from 'mongoose';

const partySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Party name is required'],
        trim: true,
        uppercase: true 
    },
    partyType: {
        type: String,
        enum: ['CUSTOMER', 'SUPPLIER', 'BOTH'],
        required: [true, 'Please specify if the party is a Customer or Supplier']
    },
    contactPerson: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    gstin: {
        type: String,
        trim: true,
        uppercase: true,
        default: 'URD' 
    },
    address: {
        street: { type: String, trim: true },
        city: { type: String, default: 'Samastipur' },
        state: { type: String, default: 'Bihar' },
        pincode: { type: String, trim: true }
    },
    // --- Financial Tracking ---
    openingBalance: {
        type: Number,
        default: 0,
        comment: 'Positive for Debit (Customer owe us), Negative for Credit (We owe Supplier)'
    },
    currentBalance: {
        type: Number,
        default: 0
    },
    creditLimit: {
        type: Number,
        default: 0 
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

/**
 * Logic Explaination:
 * Dharashakti Standard: 
 * Positive (+) Balance = DEBIT (Customer se lena hai)
 * Negative (-) Balance = CREDIT (Supplier ko dena hai)
 */

// Middleware: Nayi party banane par Opening Balance ko hi Current Balance set karna
partySchema.pre('save', function(next) {
    if (this.isNew) {
        this.currentBalance = this.openingBalance;
    }
    next();
});

// Virtual field for a summary string
partySchema.virtual('fullAddress').get(function() {
    const { street, city, state, pincode } = this.address;
    return `${street ? street + ', ' : ''}${city}, ${state}${pincode ? ' - ' + pincode : ''}`;
});

// Virtual for formatted balance display
partySchema.virtual('formattedBalance').get(function() {
    const bal = this.currentBalance;
    return bal >= 0 ? `${bal} Dr` : `${Math.abs(bal)} Cr`;
});

const Party = mongoose.models.Party || mongoose.model("Party", partySchema);

export default Party;