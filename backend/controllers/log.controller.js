import ActivityLog from "../models/activityLog.js";

export const getLogs = async (req, res) => {
  try {
    // Audit page ke liye limit hatana behtar hai ya pagination lagana
    const logs = await ActivityLog.find().sort({ createdAt: -1 }); 
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching logs" });
  }
};