import Stock from "../models/Stock.js";
import StockLog from "../models/StockLog.js";
import Product from "../models/Product.js";

/**
 * Professional Inventory Service - Crash Proof & Auto-Sync
 * Dharashakti Agro Products ERP
 */
class InventoryService {

    /**
     * @desc    Update Stock and Record Log (Handles HSN or ObjectId)
     */
    async updateStock(data, session = null) {
        // Frontend se aane wale extra fields (totalQuantity, hsn, unit, category) ko extract kiya
        const { 
            productId, 
            productName, 
            totalQuantity, 
            quantity, 
            type, 
            referenceId, 
            performedBy, 
            remarks, 
            rate, 
            hsn, 
            unit, 
            category 
        } = data;

        try {
            // 1. Find Product in Master (Flexible Search: ID or HSN)
            let product;
            if (productId && productId.length === 24) {
                product = await Product.findById(productId).session(session);
            } else {
                product = await Product.findOne({ hsnCode: productId }).session(session);
            }

            // 🚀 AUTO-CREATE PRODUCT: Agar DB khali hai toh details ke sath create karein
            if (!product) {
                console.log(`📦 Creating missing product master for: ${productName || productId}`);
                product = new Product({
                    name: (productName || productId).toUpperCase(),
                    hsnCode: hsn || productId,
                    unit: unit || "KG",
                    category: category || "GRAINS",
                    currentStock: 0,
                    purchasePrice: rate || 0,
                    salesPrice: rate || 0
                });
                await product.save({ session });
            }

            // 2. Fetch or Create Stock Record (Stock.js validation fix)
            let stock = await Stock.findOne({ productId: product._id }).session(session);
            
            if (!stock) {
                stock = new Stock({
                    productId: product._id,
                    productName: product.name,
                    category: product.category || category || "GRAINS", // Fixed: category requirement
                    unit: product.unit || unit || "KG",
                    currentQuantity: 0,
                    pricePerUnit: rate || product.purchasePrice || 1, // Fixed: pricePerUnit requirement
                    avgPurchasePrice: rate || product.purchasePrice || 0,
                    lastUpdatedBy: performedBy
                });
            }

            const previousStock = stock.currentQuantity || 0;
            let newStock = previousStock;

            // 3. Logic for Inward/Outward (Industrial Weight logic)
            // Use totalQuantity (Weight) if available, else fallback to quantity (Bags)
            const stockDelta = Number(totalQuantity) || Number(quantity) || 0;

            const inwardTypes = ['INWARD', 'RETURN_IN'];
            const outwardTypes = ['OUTWARD', 'WASTAGE', 'RETURN_OUT', 'SALE'];

            if (inwardTypes.includes(type)) {
                newStock += stockDelta;
                
                // Valuation logic (Moving Average)
                if (rate && rate > 0) {
                    const oldVal = previousStock * (stock.avgPurchasePrice || 0);
                    const newVal = stockDelta * Number(rate);
                    stock.avgPurchasePrice = (oldVal + newVal) / newStock;
                    stock.pricePerUnit = rate; // Current transaction rate as base price
                }
            } else if (outwardTypes.includes(type)) {
                newStock -= stockDelta;
            }

            // 4. Master Sync: Update Stock & Product Master
            stock.currentQuantity = newStock;
            stock.lastUpdatedBy = performedBy;
            await stock.save({ session });

            product.currentStock = newStock;
            await product.save({ session });

            // 5. Audit Log Entry
            const log = new StockLog({
                productId: product._id,
                transactionType: type,
                quantity: stockDelta,
                previousStock,
                newStock,
                referenceId,
                remarks: remarks?.toUpperCase() || `SYNC: ${type}`,
                performedBy
            });

            await log.save({ session });

            return { stock, log };
        } catch (error) {
            console.error("❌ Inventory Sync Critical Error:", error.message);
            throw new Error("Inventory process failed: " + error.message);
        }
    }

    /**
     * @desc Check availability safely
     */
    async checkAvailability(productId, requestedQty) {
        let product;
        if (productId && productId.length === 24) {
            product = await Product.findById(productId);
        } else {
            product = await Product.findOne({ hsnCode: productId });
        }

        const currentQty = product ? product.currentStock : 0;
        return { 
            available: currentQty >= requestedQty, 
            current: currentQty 
        };
    }
}

export default new InventoryService();