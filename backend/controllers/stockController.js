import Product from "../models/Product.js";
import inventoryService from "../services/inventoryService.js";
import { STOCK_TRANSACTION_TYPES } from "../utils/constants.js";

/**
 * Professional Stock & Product Controller (Fixed & Updated)
 * Dharashakti Agro Products ERP
 */

// 1. CREATE PRODUCT (Sync with Product.js Schema)
export const createProduct = async (req, res, next) => {
    try {
        const { productName, hsnCode, category, unit, purchasePrice, salesPrice, openingStock } = req.body;

        // Check if product exists (using 'name' from schema)
        const productExists = await Product.findOne({ name: productName.toUpperCase() });
        if (productExists) {
            res.status(400);
            throw new Error("Product with this name already exists in Master");
        }

        // Schema ke mutabiq fields map karein
        const product = new Product({
            name: productName.toUpperCase(),
            hsnCode: hsnCode,
            category: category,
            unit: unit,
            purchasePrice: purchasePrice || 0,
            salesPrice: salesPrice || 0,
            currentStock: openingStock || 0,
            productType: req.body.productType || 'BOTH'
        });

        const savedProduct = await product.save();

        // Agar opening stock hai, toh transaction log karein
        if (openingStock > 0) {
            await inventoryService.updateStock({
                productId: savedProduct._id,
                quantity: openingStock,
                type: STOCK_TRANSACTION_TYPES.INWARD,
                remarks: "INITIAL OPENING STOCK",
                performedBy: req.user._id
            });
        }

        res.status(201).json({ 
            success: true, 
            message: "Product created successfully", 
            data: savedProduct 
        });
    } catch (error) {
        next(error);
    }
};

// 2. GET ALL PRODUCTS (Enhanced Filters)
export const getAllProducts = async (req, res, next) => {
    try {
        const { search, category, type, minStock } = req.query;
        let query = {};

        // Search by Name or HSN (Sync with Schema fields)
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { hsnCode: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) query.category = category;
        if (type) query.productType = type;

        // Low Stock Filter
        if (minStock) {
            query.currentStock = { $lte: Number(minStock) };
        }

        const products = await Product.find(query).sort({ name: 1 });
        
        res.status(200).json({ 
            success: true, 
            count: products.length, 
            data: products 
        });
    } catch (error) {
        next(error);
    }
};

// 3. MANUAL STOCK ADJUSTMENT (Fixed field: productId)
export const adjustStock = async (req, res, next) => {
    try {
        const { productId, quantity, type, remarks } = req.body;

        if (!productId || !quantity || !type) {
            res.status(400);
            throw new Error("Please provide Product ID, Quantity and Type");
        }

        const result = await inventoryService.updateStock({
            productId,
            quantity: Number(quantity),
            type: type, // WASTAGE, INWARD, OUTWARD
            remarks: remarks?.toUpperCase() || "MANUAL ADJUSTMENT",
            performedBy: req.user._id
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

// 4. UPDATE PRODUCT (Safe Update)
export const updateProduct = async (req, res, next) => {
    try {
        // Name update ho toh uppercase karein
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

// 5. DELETE PRODUCT (Enhanced Safety)
export const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            res.status(404);
            throw new Error("Product not found");
        }

        // Check if stock is strictly 0
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