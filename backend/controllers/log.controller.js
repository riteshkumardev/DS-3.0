import ActivityLog from "../models/ActivityLog.js"; // ✅ Match Case (Capital A/L)
import mongoose from "mongoose";

/**
 * ✅ READ: Get Audit Logs with Pagination & Filters
 */
export const getLogs = async (req, res) => {
  try {
    // Frontend se page aur limit ki query lena (Default: Page 1, Limit 50)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Filters (Optional: Module ya Admin ke hisab se search karne ke liye)
    const { module, adminName, date } = req.query;
    let query = {};

    if (module) query.module = module;
    if (adminName) query.adminName = { $regex: adminName, $options: "i" };
    if (date) {
      // Us specific din ke logs
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.createdAt = { $gte: start, $lt: end };
    }

    // Database se data nikalna
    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Total counts (Frontend pagination UI ke liye)
    const total = await ActivityLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      totalLogs: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: logs
    });
  } catch (error) {
    console.error("Audit Fetch Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Audit logs fetch karne mein error aaya" 
    });
  }
};

/**
 * 🗑️ DELETE: Clear Old Logs (Optional: Maintenance ke liye)
 */
export const clearOldLogs = async (req, res) => {
  try {
    // 90 din se purane logs delete karna
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await ActivityLog.deleteMany({
      createdAt: { $lt: ninetyDaysAgo }
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} purane logs clear kar diye gaye ✅`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};