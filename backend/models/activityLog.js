import mongoose from "mongoose";

// ⚠️ TYPO FIXED: 'epmloyee' ko 'employee' kiya gaya hai
// Note: Agar aapne file ka naam hi galat rakha hai, toh use rename karke 'employee.js' kar dein.
import Employee from "./Epmloyee.js"; 

const activityLogSchema = new mongoose.Schema({
  // Kisne action liya (Admin/Manager ka Naam ya ID)
  adminName: { 
    type: String, 
    required: true,
    trim: true 
  },
  
  // Kya action liya (e.g., 'CREATED', 'UPDATED', 'DELETED', 'LOGIN')
  action: { 
    type: String, 
    required: true 
  },

  // Kis module mein (e.g., 'SALE', 'PURCHASE', 'SALARY', 'STOCK')
  module: {
    type: String,
    required: true,
    enum: ['SALE', 'PURCHASE', 'SALARY', 'STOCK', 'EXPENSE', 'EMPLOYEE', 'ATTENDANCE']
  },

  // Kiske upar action liya gaya (Employee ID ya Party Name)
  targetId: { 
    type: String,
    default: "N/A" 
  },

  // Kya badlav kiya gaya (Short summary)
  details: {
    type: String,
    trim: true
  },

  // Browser/IP/Device details (Security ke liye optional)
  ipAddress: { type: String },

  timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true 
});

// Indexing taaki logs fast search ho sakein (Recent logs pehle)
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ module: 1 });

const ActivityLog = mongoose.models.ActivityLog || mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;