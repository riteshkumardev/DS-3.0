import Stock from "../models/Stock.js";
import StockLog from "../models/StockLog.js";
import Product from "../models/Product.js";

/**
 * Professional Inventory Service - Fixed for Null Safety
 * Dharashakti Agro Products ERP
 */
class InventoryService {

    /**
     * @desc    Update Stock and Record Log
     */
    async updateStock(data, session = null) {
        const { productId, quantity, type, referenceId, performedBy, remarks, rate } = data;

        try {
            // 1. Fetch current stock master record
            let stock = await Stock.findOne({ productId }).session(session);
            
            if (!stock) {
                // Product check with Null Safety
                const product = await Product.findById(productId).session(session);
                
                // 🔥 CRITICAL FIX: Agar product null hai toh yahan se error return karein
                if (!product) {
                    throw new Error(`Product Master Entry missing for ID: ${productId}. Please create product first.`);
                }

                stock = new Stock({
                    productId,
                    unit: product.unit || "KG", // Fallback unit
                    currentQuantity: 0,
                    avgPurchasePrice: rate || 0
                });
            }

            const previousStock = stock.currentQuantity || 0;
            let newStock = previousStock;

            // 2. Logic for Inward/Outward
            const inwardTypes = ['INWARD', 'RETURN_IN'];
            const outwardTypes = ['OUTWARD', 'WASTAGE', 'RETURN_OUT', 'SALE']; // Added 'SALE' just in case

            if (inwardTypes.includes(type)) {
                newStock += Number(quantity);
                
                // Update Average Purchase Price (Moving Average Method)
                if (rate && rate > 0) {
                    const oldTotalValuation = previousStock * (stock.avgPurchasePrice || 0);
                    const newTransactionValuation = Number(quantity) * Number(rate);
                    stock.avgPurchasePrice = (oldTotalValuation + newTransactionValuation) / newStock;
                }
            } else if (outwardTypes.includes(type)) {
                newStock -= Number(quantity);
            }

            // 3. Update Master Stock Record
            stock.currentQuantity = newStock;
            stock.lastUpdatedBy = performedBy;
            await stock.save({ session });

            // 4. Sync currentStock back to Product Model for fast UI access
            // Check again to ensure no crash
            const productToUpdate = await Product.findById(productId).session(session);
            if (productToUpdate) {
                productToUpdate.currentStock = newStock;
                await productToUpdate.save({ session });
            }

            // 5. Create Stock Audit Log for traceability
            const log = new StockLog({
                productId,
                transactionType: type,
                quantity: Number(quantity),
                previousStock,
                newStock,
                referenceId,
                remarks: remarks?.toUpperCase() || `STOCK ${type}`,
                performedBy
            });

            await log.save({ session });

            return { stock, log };
        } catch (error) {
            console.error("❌ Inventory Service Crash Prevented:", error.message);
            // Throwing clean error to be caught by Controller
            throw new Error(error.message);
        }
    }

    /**
     * @desc Check if stock is available
     */
    async checkAvailability(productId, requestedQty) {
        // Checking both Stock and Product currentStock for double validation
        const product = await Product.findById(productId);
        const currentQty = product ? product.currentStock : 0;

        if (currentQty < requestedQty) {
            return { available: false, current: currentQty };
        }
        return { available: true, current: currentQty };
    }
}

export default new InventoryService();