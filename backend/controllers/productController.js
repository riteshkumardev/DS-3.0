import Product from "../models/Product.js";
import logService from "../services/logService.js";

// 🔧 Helper
const normalize = (val) => (val ? val.toUpperCase().trim() : val);

// ==========================================
// 1. CREATE PRODUCT
// ==========================================
export const createProduct = async (req, res, next) => {
    try {
        let { name, category } = req.body;

        if (!name) throw new Error("Product name required");

        name = normalize(name);
        category = normalize(category);

        // ✅ Unique check
        const existing = await Product.findOne({ name });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Product already exists in master",
            });
        }

        const product = new Product({
            ...req.body,
            name,
            category,
            performedBy: req.user?._id,
        });

        const saved = await product.save();

        // ✅ Audit Log
        await logService.createLog({
            performedBy: req.user?._id,
            action: "CREATE",
            module: "PRODUCT",
            documentId: saved._id,
            newValue: saved,
            remark: `Product created - ${name}`,
            req,
        });

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: saved,
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 2. GET ALL PRODUCTS
// ==========================================
export const getAllProducts = async (req, res, next) => {
    try {
        const { search, category, isActive } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { hsnCode: { $regex: search, $options: "i" } },
            ];
        }

        if (category) {
            query.category = normalize(category);
        }

        if (isActive !== undefined) {
            query.isActive = isActive === "true";
        }

        const products = await Product.find(query)
            .sort({ name: 1 })
            .lean();

        res.status(200).json({
            success: true,
            count: products.length,
            data: products,
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 3. GET PRODUCT BY ID
// ==========================================
export const getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).json({
            success: true,
            data: product,
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 4. UPDATE PRODUCT
// ==========================================
export const updateProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;

        // 🔴 Old data (Audit)
        const oldProduct = await Product.findById(productId).lean();
        if (!oldProduct) throw new Error("Product not found");

        // Normalize fields
        if (req.body.name) req.body.name = normalize(req.body.name);
        if (req.body.category) req.body.category = normalize(req.body.category);

        // ⚠️ Critical fields restriction
        if (oldProduct.currentStock > 0) {
            if (req.body.unit && req.body.unit !== oldProduct.unit) {
                throw new Error("Cannot change unit while stock exists");
            }
        }

        const updated = await Product.findByIdAndUpdate(
            productId,
            { $set: req.body, performedBy: req.user?._id },
            { new: true, runValidators: true }
        );

        // ✅ Audit Log
        await logService.createLog({
            performedBy: req.user?._id,
            action: "UPDATE",
            module: "PRODUCT",
            documentId: updated._id,
            oldValue: oldProduct,
            newValue: updated,
            remark: `Product updated - ${updated.name}`,
            req,
        });

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: updated,
        });

    } catch (error) {
        next(error);
    }
};

// ==========================================
// 5. DELETE PRODUCT (SOFT DELETE)
// ==========================================
export const deleteProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;

        const product = await Product.findById(productId);
        if (!product) throw new Error("Product not found");

        if (product.currentStock > 0) {
            return res.status(400).json({
                success: false,
                message: `Stock available (${product.currentStock}). Use deactivate instead.`,
            });
        }

        // ✅ Soft delete (recommended)
        product.isActive = false;
        await product.save();

        // ✅ Audit Log
        await logService.logDeletion(
            req.user?._id,
            "PRODUCT",
            productId,
            product,
            req
        );

        res.status(200).json({
            success: true,
            message: "Product deactivated successfully",
        });

    } catch (error) {
        next(error);
    }
};