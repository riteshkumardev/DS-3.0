import mongoose from "mongoose";

const salaryPaymentSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: [true, "Employee ID is required"],
        uppercase: true,
        trim: true
    },
    billNo: {
        type: String,
        unique: true,
        sparse: true 
    },
    // 🚀 NEW FIELD 1: Us waqt employee ki fixed salary kya thi, yeh yahan freeze ho jayega
    baseSalaryAtThatTime: {
        type: Number,
        required: [true, "Base salary rate at that time is required"],
        min: [0, "Salary cannot be negative"],
        default: 0
    },
    // Actual amount paid (jo aap abhi save kar rahe hain)
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0, "Amount cannot be negative"]
    },
    // 🚀 NEW FIELD 2: Kis mahine ki salary hai track karne ke liye (Format: "YYYY-MM" jaise "2026-04")
    salaryMonth: {
        type: String,
        trim: true
    },
    date: {
        type: String, // YYYY-MM-DD format (Payment Date)
        required: [true, "Payment date is required"]
    },
    type: {
        type: String,
        enum: ['ADVANCE', 'SALARY', 'INCENTIVE'],
        default: 'ADVANCE',
        uppercase: true
    },
    remark: {
        type: String,
        trim: true,
        uppercase: true
    }
}, { 
    timestamps: true 
});

salaryPaymentSchema.index({ employeeId: 1, date: -1 });
// Ek naya index mahine ke hisab se query fast karne ke liye
salaryPaymentSchema.index({ employeeId: 1, salaryMonth: 1 });

export default mongoose.model('SalaryPayment', salaryPaymentSchema);