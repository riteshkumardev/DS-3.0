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
            // Ensure productId is treated as string for length check
            const pidStr = String(productId || "");

            if (pidStr && pidStr.length === 24) {
                product = await Product.findById(pidStr).session(session);
            } else {
                product = await Product.findOne({ hsnCode: pidStr }).session(session);
            }

            // 🚀 AUTO-CREATE PRODUCT: Fix for .toUpperCase() error
            if (!product) {
                // We convert to String before calling toUpperCase to prevent crashes
                const safeName = String(productName || pidStr || "UNKNOWN PRODUCT").toUpperCase();
                const safeHsn = String(hsn || pidStr || "N/A");

                console.log(`📦 Creating missing product master for: ${safeName}`);
                
                product = new Product({
                    name: safeName,
                    hsnCode: safeHsn,
                    unit: unit || "KG",
                    category: category || "GRAINS",
                    currentStock: 0,
                    purchasePrice: rate || 0,
                    salesPrice: rate || 0
                });
                await product.save({ session });
            }

            // 2. Fetch or Create Stock Record
            let stock = await Stock.findOne({ productId: product._id }).session(session);
            
            if (!stock) {
                stock = new Stock({
                    productId: product._id,
                    productName: product.name,
                    category: product.category || category || "GRAINS",
                    unit: product.unit || unit || "KG",
                    currentQuantity: 0,
                    pricePerUnit: rate || product.purchasePrice || 0,
                    avgPurchasePrice: rate || product.purchasePrice || 0,
                    lastUpdatedBy: performedBy
                });
            }

            const previousStock = toSafeNumber(stock.currentQuantity);
            let newStock = previousStock;

            // 3. Logic for Inward/Outward (Industrial Weight logic)
            const stockDelta = toSafeNumber(totalQuantity) || toSafeNumber(quantity) || 0;

            const inwardTypes = ['INWARD', 'RETURN_IN'];
            const outwardTypes = ['OUTWARD', 'WASTAGE', 'RETURN_OUT', 'SALE'];

            if (inwardTypes.includes(type)) {
                newStock += stockDelta;
                
                // Valuation logic (Moving Average)
                if (rate && rate > 0) {
                    const oldVal = previousStock * toSafeNumber(stock.avgPurchasePrice);
                    const newVal = stockDelta * toSafeNumber(rate);
                    stock.avgPurchasePrice = newStock > 0 ? (oldVal + newVal) / newStock : rate;
                    stock.pricePerUnit = rate; 
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
                remarks: remarks ? String(remarks).toUpperCase() : `SYNC: ${type}`,
                performedBy
            });

            await log.save({ session });

            return { stock, log };
        } catch (error) {
            console.error("❌ Inventory Sync Critical Error:", error.message);
            throw new Error("Inventory process failed: " + error.message);
        }
    }

    async checkAvailability(productId, requestedQty) {
        let product;
        const pidStr = String(productId || "");
        if (pidStr && pidStr.length === 24) {
            product = await Product.findById(pidStr);
        } else {
            product = await Product.findOne({ hsnCode: pidStr });
        }

        const currentQty = product ? toSafeNumber(product.currentStock) : 0;
        return { 
            available: currentQty >= requestedQty, 
            current: currentQty 
        };
    }
}

// Internal Helper
const toSafeNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

export default new InventoryService();