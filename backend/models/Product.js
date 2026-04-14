// Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        uppercase: true,
        // Sales aur Purchase ke basis par enum validation (optional, flexibility ke liye hata bhi sakte hain)
        enum: [
            "CORN GRIT", "CORN GRIT (3MM)", "CATTLE FEED", "RICE GRIT", 
            "CORN FLOUR", "RICE FLOUR", "CORN", "PACKING BAG", 
            "RICE BROKEN", "OTHER"
        ]
    },
    productType: {
        type: String,
        enum: ['SALE', 'PURCHASE', 'BOTH'],
        default: 'BOTH',
        comment: 'Identify if item is raw material (Purchase) or finished good (Sale)'
    },
    category: {
        type: String,
        enum: ['SEEDS', 'FERTILIZER', 'PESTICIDES', 'GRAINS', 'PACKAGING', 'OTHERS'],
        required: [true, 'Category is required']
    },
    hsnCode: {
        type: String,
        required: [true, 'HSN Code is required for GST compliance'],
        trim: true
    },
    unit: {
        type: String,
        enum: ['KG', 'QUINTAL', 'TON', 'BAG', 'PACKET', 'LTR', 'PCS'],
        required: [true, 'Unit of Measurement is required']
    },
    // --- Pricing & Tax ---
    purchasePrice: {
        type: Number,
        required: [true, 'Purchase price is required'],
        default: 0
    },
    salesPrice: {
        type: Number,
        required: [true, 'Sales price is required'],
        default: 0
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
    timestamps: true
});

// Virtual field to calculate Profit Margin per unit
productSchema.virtual('profitMargin').get(function() {
    return this.salesPrice - this.purchasePrice;
});


// Modern Export Syntax (Default Export)
const Product = mongoose.model("Product", productSchema);
export default Product;