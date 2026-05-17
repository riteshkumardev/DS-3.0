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
        sparse: true // Taaki purani records collapse na karein
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0, "Amount cannot be negative"]
    },
    date: {
        type: String, // YYYY-MM-DD format
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

export default mongoose.model('SalaryPayment', salaryPaymentSchema);