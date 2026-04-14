import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        uppercase: true,
        unique: true, // Do product ek naam ke nahi ho sakte
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
        required: [true, 'Purchase price is required'],
        default: 0,
        min: 0
    },
    salesPrice: {
        type: Number,
        required: [true, 'Sales price is required'],
        default: 0,
        min: 0
    },
    gstRate: {
        type: Number,
        enum: [0, 5, 12, 18, 28],
        default: 5
    },
    // --- Inventory Control ---
    minStockLevel: {
        type: Number,
        default: 10
    },
    currentStock: {
        type: Number,
        default: 0
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

// Virtual field to calculate Profit Margin per unit
productSchema.virtual('profitMargin').get(function() {
    return this.salesPrice - this.purchasePrice;
});

// Compound Index for searching
productSchema.index({ name: 'text', hsnCode: 'text' });

const Product = mongoose.model("Product", productSchema);
export default Product;