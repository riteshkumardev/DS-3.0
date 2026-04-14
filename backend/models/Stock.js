// Stock.js
import mongoose from "mongoose";

/**
 * Stock Master Schema - Dharashakti Agro Products
 * Yeh file current stock levels aur product details track karti hai.
 */
const stockSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: [true, "Product name is required"],
        unique: true,
        trim: true,
        uppercase: true
    },
    category: {
        type: String,
        required: [true, "Category is required"], // e.g., Fertilizer, Seeds, Pesticides
        index: true
    },
    currentStock: {
        type: Number,
        default: 0,
        min: [0, "Stock cannot be negative"]
    },
    unit: {
        type: String,
        default: "KG", // e.g., KG, BAG, QUINTAL
        uppercase: true
    },
    minStockLevel: {
        type: Number,
        default: 10, // Dashboard par alert dikhane ke liye
    },
    pricePerUnit: {
        type: Number,
        required: [true, "Base price is required"]
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { 
    timestamps: true 
});

// Search ko fast karne ke liye indexing
stockSchema.index({ productName: 'text' });

const Stock = mongoose.model("Stock", stockSchema);

export default Stock;