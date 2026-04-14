import Stock from "../models/Stock.js";
import ActivityLog from "../models/ActivityLog.js"; // ✅ Fixed Case: Capital A and L

/* =============================================
    📜 Helper: Audit Logger
============================================= */
const logAudit = async (adminName, action, module = "STOCK") => {
  try {
    // Model Overwrite se bachne ke liye mongoose.models check (Optional but safe)
    await ActivityLog.create({
      adminName: adminName || "System",
      action: action,
      module: module,
      createdAt: new Date()
    });
  } catch (err) {
    console.error("Audit Logging Failed:", err);
  }
};

/**
 * ➕ CREATE/ADD STOCK (Independent with Audit)
 */
export const addStockItem = async (req, res) => {
  try {
    const { productName, totalQuantity, remarks, adminName, minStockLevel } = req.body;

    if (!productName) {
      return res.status(400).json({ success: false, message: "Product Name is required" });
    }

    const trimmedName = productName.toUpperCase().trim();

    const stock = await Stock.findOneAndUpdate(
      { productName: trimmedName },
      { 
        $set: { 
          productName: trimmedName,
          totalQuantity: Number(totalQuantity) || 0, 
          minStockLevel: Number(minStockLevel) || 5, // 🆕 Low stock alert threshold
          remarks: remarks || "Manual Entry",
          updatedAt: new Date()
        } 
      },
      { new: true, upsert: true, runValidators: true }
    );

    // ✅ AUDIT LOG: Stock Entry
    await logAudit(
      adminName, 
      `Stock Entry: ${trimmedName} set to ${totalQuantity} units (${remarks || 'Manual'})`
    );

    res.status(201).json({
      success: true,
      message: "Stock item added/updated successfully ✅",
      data: stock
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * 📄 GET ALL STOCKS (With Low Stock Flag)
 */
export const getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ productName: 1 });
    
    // 🆕 Frontend ke liye extra info: Kaunsa maal khatam ho raha hai
    const enrichedData = stocks.map(item => ({
      ...item._doc,
      isLowStock: item.totalQuantity <= (item.minStockLevel || 5)
    }));

    res.json({ success: true, data: enrichedData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 🛠️ UPDATE STOCK MANUALLY
 */
export const updateStock = async (req, res) => {
  try {
    const { productName, totalQuantity, remarks, adminName, minStockLevel } = req.body;
    
    const stock = await Stock.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          productName: productName?.toUpperCase().trim(),
          totalQuantity: Number(totalQuantity), 
          minStockLevel: Number(minStockLevel),
          remarks: remarks,
          updatedAt: new Date()
        } 
      },
      { new: true, runValidators: true }
    );

    if (!stock) throw new Error("Stock item not found");

    // ✅ AUDIT LOG
    await logAudit(
      adminName, 
      `Stock Adjusted: ${stock.productName} updated to ${totalQuantity} units.`
    );

    res.json({ 
      success: true, 
      message: "Stock updated successfully ✅", 
      data: stock 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * ❌ DELETE STOCK
 */
export const deleteStock = async (req, res) => {
  try {
    const { id } = req.params;
    const adminName = req.query.adminName;
    
    const stockItem = await Stock.findById(id);
    if (!stockItem) throw new Error("Item not found");

    await Stock.findByIdAndDelete(id);

    // ✅ AUDIT LOG: Critical Stock Removal
    await logAudit(
      adminName, 
      `⚠️ CRITICAL: Stock Item Deleted! ${stockItem.productName} removed from database.`,
      "STOCK"
    );

    res.json({ success: true, message: "Stock item deleted successfully 🗑️" });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};