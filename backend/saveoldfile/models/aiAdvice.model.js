import mongoose from "mongoose";

const aiAdviceSchema = new mongoose.Schema(
  {
    date: { 
      type: String, 
      required: true // YYYY-MM-DD (Analysis kis din ka hai)
    },
    totalReceive: { 
      type: Number, 
      default: 0 // Total expected collection (Sales)
    },
    totalPay: { 
      type: Number, 
      default: 0 // Total pending payments (Purchase/Salary)
    },
    netFlow: { 
      type: Number, 
      default: 0 // Receive - Pay
    },
    status: {
      type: String,
      enum: ['Healthy', 'Warning', 'Critical'],
      default: 'Healthy'
    },
    advice: { 
      type: String, 
      required: true // AI Generated message (e.g. "Payment collection slow hai")
    },
    suggestions: [String] // Array for bullet points (e.g. ["Call Party A", "Reduce Fuel Exp"])
  },
  { timestamps: true }
);

// Date wise index taaki purani advice jaldi mile
aiAdviceSchema.index({ date: -1 });

export default mongoose.model("AIAdvice", aiAdviceSchema);