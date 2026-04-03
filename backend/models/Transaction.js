import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  // Party Name: String rakhenge taaki hum Supplier, Customer ya Employee kisi ko bhi handle kar sakein
  // Agar aap sirf ID rakhna chahte hain toh 'refPath' use hota hai, par String zyada flexible hai
  partyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: 'partyModel' // Dynamic reference support
  },
  partyModel: {
    type: String,
    required: true,
    enum: ['Supplier', 'Sale', 'Employee'] // In teeno mein se koi bhi ho sakta hai
  },
  partyName: { type: String, required: true }, // Display ke liye aasaan rahega

  // Consistent Date Format (YYYY-MM-DD) as per other models
  date: { 
    type: String, 
    required: true 
  },

  // CREDIT = Paisa Aaya (Income), DEBIT = Paisa Gaya (Expense)
  // 'IN'/'OUT' bhi sahi hai, par accounting terms use karna better hai
  type: { 
    type: String, 
    enum: ['IN', 'OUT'], 
    required: true 
  },

  amount: { 
    type: Number, 
    required: true,
    min: 0
  },

  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'Bank', 'UPI', 'Cheque'],
    default: "Cash" 
  },

  description: { 
    type: String, 
    default: "Manual Ledger Entry" 
  },

  // Transaction ke baad us party ka kitna hisab bacha
  remainingBalance: { 
    type: Number,
    required: true
  },

  // Reference ke liye: Bill No ya Invoice No jisse ye juda hai
  refNo: { type: String } 

}, { timestamps: true });

// Indexing for speed
transactionSchema.index({ partyId: 1, date: -1 });
transactionSchema.index({ partyModel: 1 });

export default mongoose.model('Transaction', transactionSchema);