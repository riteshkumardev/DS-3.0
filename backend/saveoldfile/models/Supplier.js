import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    uppercase: true // Taaki 'Ramesh' aur 'ramesh' duplicate na ho
  },
  gstin: { 
    type: String, 
    default: "N/A",
    trim: true 
  },
  phone: { 
    type: String, 
    trim: true 
  }, 
  address: { 
    type: String, 
    trim: true 
  },

  // Financial Tracking
  openingBalance: { type: Number, default: 0 }, // Business shuru karte waqt ka purana hisab
  totalPurchased: { type: Number, default: 0 }, // Ab tak ka total bill amount
  totalPaid: { type: Number, default: 0 },      // Humne ab tak kitna paisa diya
  
  // Current Outstanding (Logic: opening + totalPurchased - totalPaid)
  currentBalance: { 
    type: Number, 
    default: 0 
  },

  // Last Transaction Details
  lastBillNo: { type: String },
  lastBillDate: { 
    type: String, // ✅ String format (YYYY-MM-DD) for consistency
    default: "" 
  },
  
  remarks: { type: String }
}, { 
  timestamps: true 
});

// Search optimize karne ke liye index
supplierSchema.index({ name: 1 });
supplierSchema.index({ phone: 1 });

const Supplier = mongoose.model("Supplier", supplierSchema);
export default Supplier;