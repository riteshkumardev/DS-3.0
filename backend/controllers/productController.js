import Product from "../models/Product.js";

/**
 * Product Controller - Dharashakti Agro Products ERP
 * Provides Master Data Management for Grains, Packaging, etc.
 */

// 1. CREATE NEW PRODUCT
export const createProduct = async (req, res, next) => {
    try {
        const { name } = req.body;

        // Check if product exists (Unique constraint handle)
        const existingProduct = await Product.findOne({ name: name.toUpperCase() });
        if (existingProduct) {
            return res.status(400).json({ 
                success: false, 
                message: "Ye product pehle se Master list mein hai." 
            });
        }

        const product = new Product({
            ...req.body,
            performedBy: req.user._id // Tracking ke liye
        });

        const savedProduct = await product.save();
        res.status(201).json({ 
            success: true, 
            message: "Product Master mein add ho gaya!", 
            data: savedProduct 
        });
    } catch (error) {
        next(error);
    }
};

// 2. GET ALL PRODUCTS (With Search & Filters)
export const getAllProducts = async (req, res, next) => {
    try {
        const { search, category, isActive } = req.query;
        let query = {};

        // Search by Name or HSN Code
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { hsnCode: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by Category
        if (category) {
            query.category = category.toUpperCase();
        }

        // Filter by Status (Active/Inactive)
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
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

// 3. GET SINGLE PRODUCT BY ID
export const getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product nahi mila." });
        }
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

// 4. UPDATE PRODUCT MASTER
export const updateProduct = async (req, res, next) => {
    try {
        // Unique validation handle karne ke liye runValidators: true zaroori hai
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: "Product update nahi ho paya." });
        }

        res.status(200).json({ 
            success: true, 
            message: "Product details update ho gayi hain.", 
            data: updatedProduct 
        });
    } catch (error) {
        next(error);
    }
};

// 5. DELETE PRODUCT (Soft Delete Recommended)
export const deleteProduct = async (req, res, next) => {
    try {
        // ERP mein data delete karne se Ledger/Purchase kharab ho sakta hai
        // Isliye hum check karenge ki Stock 0 hai ya nahi
        const product = await Product.findById(req.params.id);
        
        if (product.currentStock > 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Is product ka stock abhi bacha hai, delete nahi kar sakte. IsActive False kar dein." 
            });
        }

        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Product Master se remove kar diya gaya." });
    } catch (error) {
        next(error);
    }
};