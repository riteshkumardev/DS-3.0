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
        const { productId, productName, quantity, type, referenceId, performedBy, remarks, rate, hsn, unit, category } = data;

        try {
            // 1. Find Product in Master (Flexible Search: ID or HSN)
            let product;
            if (productId && productId.length === 24) {
                product = await Product.findById(productId).session(session);
            } else {
                product = await Product.findOne({ hsnCode: productId }).session(session);
            }

            // 🚀 AUTO-CREATE PRODUCT: Agar DB khali hai toh crash hone ke bajaye product create karein
            if (!product) {
                console.log(`Creating missing product master for: ${productName || productId}`);
                product = new Product({
                    name: (productName || productId).toUpperCase(),
                    hsnCode: hsn || productId,
                    unit: unit || "KG",
                    category: category || "OTHERS",
                    currentStock: 0,
                    purchasePrice: rate || 0,
                    salesPrice: rate || 0
                });
                await product.save({ session });
            }

            // 2. Fetch or Create Stock Record for this product
            let stock = await Stock.findOne({ productId: product._id }).session(session);
            
            if (!stock) {
                stock = new Stock({
                    productId: product._id,
                    productName: product.name,
                    unit: product.unit || "KG",
                    currentQuantity: 0,
                    avgPurchasePrice: rate || 0
                });
            }

            const previousStock = stock.currentQuantity || 0;
            let newStock = previousStock;

            // 3. Logic for Inward/Outward
            const inwardTypes = ['INWARD', 'RETURN_IN'];
            const outwardTypes = ['OUTWARD', 'WASTAGE', 'RETURN_OUT', 'SALE'];

            if (inwardTypes.includes(type)) {
                newStock += Number(quantity);
                
                // Valuation logic
                if (rate && rate > 0) {
                    const oldVal = previousStock * (stock.avgPurchasePrice || 0);
                    const newVal = Number(quantity) * Number(rate);
                    stock.avgPurchasePrice = (oldVal + newVal) / newStock;
                }
            } else if (outwardTypes.includes(type)) {
                newStock -= Number(quantity);
            }

            // 4. Master Sync: Update Stock & Product currentStock
            stock.currentQuantity = newStock;
            stock.lastUpdatedBy = performedBy;
            await stock.save({ session });

            product.currentStock = newStock;
            await product.save({ session });

            // 5. Audit Log
            const log = new StockLog({
                productId: product._id,
                transactionType: type,
                quantity: Number(quantity),
                previousStock,
                newStock,
                referenceId,
                remarks: remarks?.toUpperCase() || `AUTO-SYNC: ${type}`,
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
        if (productId.length === 24) {
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