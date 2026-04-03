import mongoose from "mongoose";

// ⚠️ Yahan se purana import hata diya gaya hai kyunki ye khud wahi file hai

const salaryPaymentSchema = new mongoose.Schema({
    employeeId: { 
        type: String, 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true 
    },
    date: { 
        type: String, 
        required: true // Format: YYYY-MM-DD
    },
    type: { 
        type: String, 
        enum: ["Advance", "Salary"], 
        default: "Advance" 
    }
}, { timestamps: true });

// Export karte waqt dhayan rakhein ki naam wahi ho jo controllers mein use ho raha hai
export default mongoose.model("SalaryPayment", salaryPaymentSchema);