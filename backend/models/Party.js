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
        street: String,
        city: { type: String, default: 'Samastipur' },
        state: { type: String, default: 'Bihar' },
        pincode: String
    },
    // --- Financial Tracking ---
    openingBalance: {
        type: Number,
        default: 0
    },
    balanceType: {
        type: String,
        enum: ['DEBIT', 'CREDIT'], 
        default: 'DEBIT',
        comment: 'DEBIT means they owe us (Customer), CREDIT means we owe them (Supplier)'
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

// Middleware: Nayi party banane par Opening Balance ko hi Current Balance set karna
partySchema.pre('save', function(next) {
    if (this.isNew) {
        this.currentBalance = this.openingBalance;
    }
    next();
});

// Virtual field for a summary string
partySchema.virtual('fullAddress').get(function() {
    return `${this.address.street || ''}, ${this.address.city}, ${this.address.state} - ${this.address.pincode || ''}`;
});

// Fix: Model ko ek hi baar define karein aur sirf export default use karein
const Party = mongoose.models.Party || mongoose.model("Party", partySchema);

export default Party;