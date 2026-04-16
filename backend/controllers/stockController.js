import Product from "../models/Product.js";
import inventoryService from "../services/inventoryService.js";
import { STOCK_TRANSACTION_TYPES } from "../utils/constants.js";
import mongoose from "mongoose";

// 🔧 Helpers
const safeUpper = (v) => String(v || "").toUpperCase();
const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// ==========================================
// 1. CREATE PRODUCT
// ==========================================
export const createProduct = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let { productName, hsnCode, category, unit, purchasePrice, salesPrice, openingStock } = req.body;

        if (!productName) throw new Error("Product name is required");

        const nameUpper = safeUpper(productName);

        // 🔴 Duplicate check (Name + HSN)
        const existing = await Product.findOne({
            $or: [
                { name: nameUpper },
                { hsnCode: hsnCode }
            ]
        }).session(session);

        if (existing) throw new Error("Product with same Name or HSN already exists");

        // 🔥 Always create with ZERO stock
        const product = await Product.create([{
            name: nameUpper,
            hsnCode,
            category,
            unit,
            purchasePrice: toNum(purchasePrice),
            salesPrice: toNum(salesPrice),
            currentStock: 0,
            productType: req.body.productType || "BOTH"
        }], { session });

        const savedProduct = product[0];

        // 🔥 Opening stock via Inventory ONLY (single source of truth)
        if (toNum(openingStock) > 0) {
            await inventoryService.updateStock({
                productId: savedProduct._id,
                productName: nameUpper,
                quantity: toNum(openingStock),
                type: STOCK_TRANSACTION_TYPES.INWARD,
                remarks: "OPENING STOCK",
                performedBy: req.user?._id,
                unit,
                category,
                rate: toNum(purchasePrice)
            }, session);
        }

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: savedProduct
        });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// ==========================================
// 2. GET ALL PRODUCTS (WITH PAGINATION)
// ==========================================
export const getAllProducts = async (req, res, next) => {
    try {
        const { search, category, type, minStock, page = 1, limit = 20 } = req.query;

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { hsnCode: { $regex: search, $options: "i" } }
            ];
        }

        if (category) query.category = category;
        if (type) query.productType = type;
        if (minStock) query.currentStock = { $lte: Number(minStock) };

        const skip = (Number(page) - 1) * Number(limit);

        const [products, total] = await Promise.all([
            Product.find(query)
                .sort({ name: 1 })
                .skip(skip)
                .limit(Number(limit)),

            Product.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            data: products
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 3. STOCK ADJUSTMENT (SAFE)
// ==========================================
export const adjustStock = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            productId,
            productName,
            quantity,
            totalQuantity,
            type,
            remarks,
            unit,
            category,
            hsn
        } = req.body;

        if (!productId) throw new Error("Product ID required");
        if (!type) throw new Error("Transaction type required");

        const qty = toNum(totalQuantity) || toNum(quantity);
        if (qty <= 0) throw new Error("Valid quantity required");

        const result = await inventoryService.updateStock({
            productId,
            productName,
            quantity: qty,
            totalQuantity: qty,
            type,
            remarks: safeUpper(remarks || "MANUAL ADJUSTMENT"),
            performedBy: req.user?._id,
            unit,
            category,
            hsn
        }, session);

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: "Stock updated successfully",
            data: result.stock
        });

    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

// ==========================================
// 4. UPDATE PRODUCT (SAFE)
// ==========================================
export const updateProduct = async (req, res, next) => {
    try {
        const allowedFields = [
            "name",
            "hsnCode",
            "category",
            "unit",
            "purchasePrice",
            "salesPrice",
            "productType"
        ];

        let updateData = {};

        for (let key of allowedFields) {
            if (req.body[key] !== undefined) {
                updateData[key] = key === "name"
                    ? safeUpper(req.body[key])
                    : req.body[key];
            }
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!product) throw new Error("Product not found");

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 5. DELETE PRODUCT
// ==========================================
export const deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) throw new Error("Product not found");

        if (toNum(product.currentStock) !== 0) {
            throw new Error(
                `Cannot delete. Stock available: ${product.currentStock} ${product.unit}`
            );
        }

        await Product.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        next(error);
    }
};