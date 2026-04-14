import mongoose from "mongoose";

/**
 * Stock Master Schema - Dharashakti Agro Products
 * Yeh file current stock levels aur product details track karti hai.
 */
const stockSchema = new mongoose.Schema({
    // 🔗 Product Master se link karne ke liye
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, "Product ID reference is required"],
        unique: true // Ek product ka ek hi stock record hoga
    },
    productName: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
        uppercase: true
    },
    category: {
        type: String,
        required: [false, "Category is optional"], // Flexible for auto-sync
        index: true,
        uppercase: true,
        default: "GRAINS"
    },
    currentQuantity: {
        type: Number,
        default: 0,
        min: [0, "Stock cannot be negative"]
    },
    unit: {
        type: String,
        default: "KG",
        uppercase: true
    },
    minStockLevel: {
        type: Number,
        default: 10,
    },
    // 💰 Moving Average ya Last Purchase Rate track karne ke liye
    avgPurchasePrice: {
        type: Number,
        default: 0
    },
    pricePerUnit: {
        type: Number,
        required: [false, "Base price is optional"],
        default: 0
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { 
    timestamps: true 
});

// 🔍 Fast searching index
stockSchema.index({ productName: 'text', productId: 1 });

const Stock = mongoose.model("Stock", stockSchema);

export default Stock;