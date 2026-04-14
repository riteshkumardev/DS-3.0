import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
  // Unique Product Name (e.g., 'Diesel', 'Tyre', 'Cement')
  productName: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    uppercase: true // Consistency ke liye hamesha CAPS mein save hoga
  },

  // Stock Calculation Fields
  openingStock: { type: Number, default: 0 }, // Saal ya Mahine ke shuru ka stock
  totalIn: { type: Number, default: 0 },      // Total Purchase kitni hui
  totalOut: { type: Number, default: 0 },     // Total Sale kitni hui
  
  // Current Available Stock (Logic: opening + totalIn - totalOut)
  totalQuantity: { 
    type: Number, 
    default: 0 
  }, 

  unit: { 
    type: String, 
    enum: ['Ltrs', 'Nos', 'Kg', 'Bags', 'Units'], 
    default: 'Units' 
  },

  remarks: { type: String }
}, { 
  timestamps: true 
});

// Indexing for faster search
stockSchema.index({ productName: 1 });

export default mongoose.model("Stock", stockSchema);