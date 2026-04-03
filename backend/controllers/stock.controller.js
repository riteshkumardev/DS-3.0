import Stock from "../models/Stock.js";
import ActivityLog from "../models/activityLog.js"; // ✅ Audit Log model import kiya

/* =============================================
    📜 Helper: Audit Logger
============================================= */
const logAudit = async (adminName, action, module = "STOCK") => {
  try {
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
    const { productName, totalQuantity, remarks, adminName } = req.body;

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
          remarks: remarks || "Manual Entry",
          updatedAt: new Date()
        } 
      },
      { new: true, upsert: true, runValidators: true }
    );

    // ✅ AUDIT LOG: Stock Entry
    await logAudit(
      adminName, 
      `Stock Entry: ${trimmedName} quantity set to ${totalQuantity} (${remarks || 'Manual'})`
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
 * 📄 GET ALL STOCKS
 */
export const getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ productName: 1 });
    res.json({ success: true, data: stocks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 🛠️ UPDATE STOCK MANUALLY (Audit Enabled)
 */
export const updateStock = async (req, res) => {
  try {
    const { productName, totalQuantity, remarks, adminName } = req.body;
    
    const stock = await Stock.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          productName: productName?.toUpperCase().trim(),
          totalQuantity: Number(totalQuantity), 
          remarks: remarks,
          updatedAt: new Date()
        } 
      },
      { new: true, runValidators: true }
    );

    // ✅ AUDIT LOG: Manual Stock Adjustment
    await logAudit(
      adminName, 
      `Stock Adjusted: ${stock.productName} updated to ${totalQuantity} units.`
    );

    res.json({ 
      success: true, 
      message: "Stock updated independently successfully", 
      data: stock 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * ❌ DELETE STOCK (Critical Audit)
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

    res.json({ success: true, message: "Stock item deleted from database" });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};