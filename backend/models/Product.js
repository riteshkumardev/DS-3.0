import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        uppercase: true,
        unique: true,
        index: true
    },
    productType: {
        type: String,
        enum: ['SALE', 'PURCHASE', 'BOTH'],
        default: 'BOTH'
    },
    category: {
        type: String,
        enum: ['SEEDS', 'FERTILIZER', 'PESTICIDES', 'GRAINS', 'PACKAGING', 'OTHERS'],
        default: 'GRAINS',
        required: [true, 'Category is required'],
        uppercase: true
    },
    hsnCode: {
        type: String,
        required: [true, 'HSN Code is required for GST compliance'],
        trim: true,
        index: true
    },
    unit: {
        type: String,
        enum: ['KG', 'QUINTAL', 'TON', 'BAG', 'PACKET', 'LTR', 'PCS'],
        default: 'KG',
        required: [true, 'Unit of Measurement is required'],
        uppercase: true
    },
    // --- Pricing & Tax ---
    purchasePrice: {
        type: Number,
        required: [true, 'Default purchase price is required'],
        default: 0,
        min: [0, 'Price cannot be negative']
    },
    salesPrice: {
        type: Number,
        required: [true, 'Default sales price is required'],
        default: 0,
        min: [0, 'Price cannot be negative']
    },
    gstRate: {
        type: Number,
        enum: {
            values: [0, 5, 12, 18, 28],
            message: '{VALUE} is not a valid GST rate'
        },
        default: 5
    },
    // --- Inventory Control ---
    minStockLevel: {
        type: Number,
        default: 10,
        min: 0
    },
    currentStock: {
        type: Number,
        default: 0 // Manual inventory update controller se hoga
    },
    description: {
        type: String,
        trim: true
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

// --- Virtuals ---
// Profit Margin Calculation
productSchema.virtual('profitMargin').get(function() {
    return this.salesPrice - this.purchasePrice;
});

// Margin Percentage
productSchema.virtual('marginPercentage').get(function() {
    if (this.purchasePrice <= 0) return 0;
    return ((this.salesPrice - this.purchasePrice) / this.purchasePrice) * 100;
});

// --- Indexes for ERP Speed ---
productSchema.index({ name: 'text', hsnCode: 'text', category: 'text' });

// --- Pre-save Hook (Example: Auto-fix HSN if missing based on your list) ---
productSchema.pre('save', function(next) {
    if (!this.hsnCode) {
        const name = this.name.toUpperCase();
        if (name.includes("CATTLE FEED")) this.hsnCode = "23099010";
        else if (name.includes("CORN GRIT")) this.hsnCode = "11031300";
        else if (name.includes("RICE GRIT")) this.hsnCode = "10064000";
        else if (name.includes("BAG")) this.hsnCode = "63053300";
        else this.hsnCode = "00000000";
    }
    next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;