import Product from "../models/Product.js";
import inventoryService from "../services/inventoryService.js";
import { STOCK_TRANSACTION_TYPES } from "../utils/constants.js";

/**
 * Professional Stock & Product Controller
 * Dharashakti Agro Products ERP
 */

// 1. CREATE PRODUCT (Manual Master Entry)
export const createProduct = async (req, res, next) => {
    try {
        const { productName, hsnCode, category, unit, purchasePrice, salesPrice, openingStock } = req.body;

        const nameUpper = productName.toUpperCase();
        const productExists = await Product.findOne({ name: nameUpper });
        
        if (productExists) {
            res.status(400);
            throw new Error("Product with this name already exists in Master");
        }

        const product = new Product({
            name: nameUpper,
            hsnCode,
            category,
            unit,
            purchasePrice: purchasePrice || 0,
            salesPrice: salesPrice || 0,
            currentStock: openingStock || 0,
            productType: req.body.productType || 'BOTH'
        });

        const savedProduct = await product.save();

        if (openingStock > 0) {
            await inventoryService.updateStock({
                productId: savedProduct._id,
                productName: nameUpper,
                quantity: openingStock,
                type: STOCK_TRANSACTION_TYPES.INWARD,
                remarks: "INITIAL OPENING STOCK",
                performedBy: req.user._id,
                unit,
                category
            });
        }

        res.status(201).json({ success: true, data: savedProduct });
    } catch (error) {
        next(error);
    }
};

// 2. GET ALL PRODUCTS
export const getAllProducts = async (req, res, next) => {
    try {
        const { search, category, type, minStock } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { hsnCode: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) query.category = category;
        if (type) query.productType = type;
        if (minStock) query.currentStock = { $lte: Number(minStock) };

        const products = await Product.find(query).sort({ name: 1 });
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) {
        next(error);
    }
};

// 3. STOCK ADJUSTMENT (Fixed for Auto-Sync)
export const adjustStock = async (req, res, next) => {
    try {
        // Frontend se saari details nikaali taaki agar product naya ho toh sync ho jaye
        const { productId, productName, quantity, totalQuantity, type, remarks, unit, category, hsn } = req.body;

        if (!productId || (!quantity && !totalQuantity) || !type) {
            res.status(400);
            throw new Error("Please provide Product ID, Quantity and Type");
        }

        const result = await inventoryService.updateStock({
            productId,    // Can be ObjectId or HSN
            productName,  // From frontend dropdown
            quantity: Number(quantity) || 0,
            totalQuantity: Number(totalQuantity) || 0,
            type,         // INWARD, OUTWARD, etc.
            remarks: remarks?.toUpperCase() || "MANUAL ADJUSTMENT",
            performedBy: req.user._id,
            unit,         // For auto-create safety
            category,     // For auto-create safety
            hsn           // For auto-create safety
        });

        res.status(200).json({ 
            success: true, 
            message: "Inventory synced successfully", 
            data: result.stock 
        });
    } catch (error) {
        next(error);
    }
};

// 4. UPDATE PRODUCT
export const updateProduct = async (req, res, next) => {
    try {
        if (req.body.name) req.body.name = req.body.name.toUpperCase();

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!product) {
            res.status(404);
            throw new Error("Product record not found");
        }

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

// 5. DELETE PRODUCT
export const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            res.status(404);
            throw new Error("Product not found");
        }

        if (product.currentStock !== 0) {
            res.status(400);
            throw new Error(`Cannot delete. Current stock is ${product.currentStock} ${product.unit}.`);
        }

        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Product deleted from master" });
    } catch (error) {
        next(error);
    }
};