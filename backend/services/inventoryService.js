// inventoryService.js
import Stock from "../models/Stock.js";
import StockLog from "../models/StockLog.js";
import Product from "../models/Product.js";

/**
 * Professional Inventory Service
 * Dharashakti Agro Products ERP
 */
class InventoryService {

    /**
     * @desc    Update Stock and Record Log
     * @param   {Object} data - productId, quantity, type, referenceId, performedBy, remarks
     * @param   {Object} session - Mongoose session for atomicity
     */
    async updateStock(data, session = null) {
        const { productId, quantity, type, referenceId, performedBy, remarks, rate } = data;

        try {
            // 1. Fetch current stock or create if not exists
            let stock = await Stock.findOne({ productId }).session(session);
            
            if (!stock) {
                const product = await Product.findById(productId).session(session);
                stock = new Stock({
                    productId,
                    unit: product.unit,
                    currentQuantity: 0,
                    avgPurchasePrice: rate || 0
                });
            }

            const previousStock = stock.currentQuantity;
            let newStock = previousStock;

            // 2. Logic for Inward/Outward
            // INWARD: Purchase, Sales Return
            // OUTWARD: Sale, Purchase Return, Wastage
            if (['INWARD', 'RETURN_IN'].includes(type)) {
                newStock += Number(quantity);
                
                // Update Average Purchase Price (for Valuation)
                if (rate && rate > 0) {
                    stock.avgPurchasePrice = ((previousStock * stock.avgPurchasePrice) + (quantity * rate)) / newStock;
                }
            } else if (['OUTWARD', 'WASTAGE', 'RETURN_OUT'].includes(type)) {
                newStock -= Number(quantity);
            }

            // 3. Update Master Stock
            stock.currentQuantity = newStock;
            stock.lastUpdatedBy = performedBy;
            await stock.save({ session });

            // 4. Update Product Model for fast access
            await Product.findByIdAndUpdate(productId, { currentStock: newStock }).session(session);

            // 5. Create Stock Audit Log
            const log = new StockLog({
                productId,
                transactionType: type,
                quantity,
                previousStock,
                newStock,
                referenceId,
                remarks: remarks?.toUpperCase(),
                performedBy
            });

            await log.save({ session });

            return { stock, log };
        } catch (error) {
            console.error("Inventory Service Error:", error);
            throw new Error("Inventory sync failed: " + error.message);
        }
    }

    /**
     * @desc Check if stock is available for sale
     */
    async checkAvailability(productId, requestedQty) {
        const stock = await Stock.findOne({ productId });
        if (!stock || stock.currentQuantity < requestedQty) {
            return { available: false, current: stock ? stock.currentQuantity : 0 };
        }
        return { available: true, current: stock.currentQuantity };
    }
}

export default new InventoryService();