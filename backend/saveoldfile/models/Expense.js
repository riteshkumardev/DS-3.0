import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  // Transaction date (YYYY-MM-DD format) - Consistent with Sale/Purchase/Salary
  date: { 
    type: String, 
    required: true 
  },
  
  // Kisko payment kiya ya kisse aaya (Supplier/Party/Employee Name)
  partyName: { 
    type: String, 
    required: true,
    trim: true 
  },

  // 'Payment In' = CREDIT (Paisa Aaya)
  // 'Payment Out' = DEBIT (Paisa Gaya)
  type: { 
    type: String, 
    required: true, 
    enum: ['Payment In', 'Payment Out'],
    default: 'Payment Out'
  },

  amount: { 
    type: Number, 
    required: true,
    min: [0, "Amount cannot be negative"] 
  },

  // Category fix: 'Fuel', 'Salary', 'Maintenance' ko humne side rakha hai, 
  // par yahan "General", "Office", "Food" etc. ho sakta hai.
  category: { 
    type: String, 
    default: "General",
    trim: true
  },

  // Payment Mode (Zaroori hai taaki pata chale Cash balance kam hua ya Bank)
  paymentMode: {
    type: String,
    enum: ['Cash', 'Bank', 'UPI', 'Cheque'],
    default: 'Cash'
  },

  // Transaction ID / UTR No / Reference No
  txnId: { 
    type: String, 
    trim: true,
    default: "N/A"
  },

  remark: { 
    type: String, 
    trim: true 
  },

  // Entry time (Automated via timestamps, but manual override if needed)
  time: { 
    type: String 
  }
}, { 
  timestamps: true 
});

// Indexing for performance
expenseSchema.index({ partyName: 1, date: -1 });
expenseSchema.index({ type: 1 }); // Quick filtering for Total In vs Total Out

export default mongoose.model("Expense", expenseSchema);