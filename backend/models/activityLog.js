import mongoose from "mongoose";
import Employee from "./epmloyee.js"; // Changed from employee.js to epmloyee.js

const activityLogSchema = new mongoose.Schema({
  adminName: { type: String, required: true },
  action: { type: String, required: true },
  targetEmployeeId: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("ActivityLog", activityLogSchema);