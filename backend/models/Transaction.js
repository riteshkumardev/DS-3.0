import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  // partyId: Atlas mein IDs string format mein ho sakti hain
  // Isliye hum ise String ya ObjectId dono ke liye support de rahe hain
  partyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Supplier', 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  // IN = Payment Received (Hisab Kam), OUT = Payment Given (Hisab Badha)
  type: { 
    type: String, 
    enum: ['IN', 'OUT'], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    default: "Cash" 
  },
  description: { 
    type: String, 
    default: "Manual Ledger Entry" 
  },
  // Yeh field party ka us waqt ka latest balance store karega
  remainingBalance: { 
    type: Number,
    required: true
  }
}, { timestamps: true });

// Indexing taaki party-wise history jaldi load ho
transactionSchema.index({ partyId: 1, date: -1 });

export default mongoose.model('Transaction', transactionSchema);