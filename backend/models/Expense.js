import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  // Transaction ki date (YYYY-MM-DD format)
  date: { 
    type: String, 
    required: true 
  },
  // Kisko payment kiya ya kisse aaya (Supplier/Party Name)
  partyName: { 
    type: String, 
    required: true,
    trim: true 
  },
  // 'Payment In' (Aaya/Received) ya 'Payment Out' (Gaya/Paid)
  type: { 
    type: String, 
    required: true, 
    enum: ['Payment In', 'Payment Out'],
    default: 'Payment Out'
  },
  // Transaction amount
  amount: { 
    type: Number, 
    required: true 
  },
  // Purani 'category' field (Ab optional hai ya 'Others' default rakh sakte hain)
  category: { 
    type: String, 
    default: "General" 
  },
  // Transaction ID / UTR No / Cheque No
  txnId: { 
    type: String, 
    trim: true 
  },
  // Narration ya extra details
  remark: { 
    type: String, 
    trim: true 
  },
  // Entry ka waqt
  time: { 
    type: String 
  }
}, { 
  timestamps: true // Isse 'createdAt' aur 'updatedAt' apne aap ban jayenge
});

// Indexing taaki party-wise aur date-wise search fast ho
expenseSchema.index({ partyName: 1, date: -1 });

export default mongoose.model("Expense", expenseSchema);