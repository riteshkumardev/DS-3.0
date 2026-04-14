// stockController.js
import Product from "../models/Product.js";
import Stock from "../models/Stock.js";
import inventoryService from "../services/inventoryService.js";
import { STOCK_TRANSACTION_TYPES } from "../utils/constants.js";

/**
 * Professional Stock & Product Controller (Full CRUD with Filters)
 * Dharashakti Agro Products ERP
 */

// 1. CREATE PRODUCT (Add New Item to Inventory)
export const createProduct = async (req, res, next) => {
    try {
        const { productName, hsn, unit, openingStock, openingRate } = req.body;

        const productExists = await Product.findOne({ productName: productName.toUpperCase() });
        if (productExists) {
            res.status(400);
            throw new Error("Product already exists");
        }

        const product = new Product({
            ...req.body,
            productName: productName.toUpperCase(),
            currentStock: openingStock || 0
        });

        const savedProduct = await product.save();

        // Agar opening stock hai, toh usey Inventory Service ke through log karein
        if (openingStock > 0) {
            await inventoryService.updateStock({
                productId: savedProduct._id,
                quantity: openingStock,
                rate: openingRate,
                type: STOCK_TRANSACTION_TYPES.INWARD,
                remarks: "OPENING STOCK ENTRY",
                performedBy: req.user._id
            });
        }

        res.status(201).json({ success: true, data: savedProduct });
    } catch (error) {
        next(error);
    }
};

// 2. GET ALL PRODUCTS (With Stock Status & Filters)
export const getAllProducts = async (req, res, next) => {
    try {
        const { search, category, minStock } = req.query;
        let query = {};

        // Filter: Search by Name or HSN
        if (search) {
            query.$or = [
                { productName: { $regex: search, $options: 'i' } },
                { hsn: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter: Category
        if (category) {
            query.category = category;
        }

        // Filter: Low Stock Warning (e.g., items below 10 units)
        if (minStock) {
            query.currentStock = { $lte: Number(minStock) };
        }

        const products = await Product.find(query).sort({ productName: 1 });
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) {
        next(error);
    }
};

// 3. MANUAL STOCK ADJUSTMENT (Wastage / Correction)
export const adjustStock = async (req, res, next) => {
    try {
        const { productId, quantity, type, remarks } = req.body;

        const result = await inventoryService.updateStock({
            productId,
            quantity,
            type: type, // WASTAGE, INWARD, or OUTWARD
            remarks: remarks?.toUpperCase(),
            performedBy: req.user._id
        });

        res.status(200).json({ 
            success: true, 
            message: "Stock adjusted successfully", 
            data: result.stock 
        });
    } catch (error) {
        next(error);
    }
};

// 4. UPDATE PRODUCT INFO
export const updateProduct = async (req, res, next) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!product) {
            res.status(404);
            throw new Error("Product not found");
        }

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

// 5. DELETE PRODUCT (Safe Check)
export const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        
        // Safety Check: Agar stock 0 se zyada hai, toh delete na karne dein
        if (product.currentStock > 0) {
            res.status(400);
            throw new Error("Cannot delete product with existing stock. Please adjust stock to 0 first.");
        }

        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Product removed from system" });
    } catch (error) {
        next(error);
    }
};