import mongoose from "mongoose";

const salaryPaymentSchema = new mongoose.Schema({
    employeeId: { 
        type: String, 
        required: true // Employee model ke employeeId se match karega
    },
    employeeName: { type: String }, // Optional: Reporting ke liye aasaan rahega
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
        default: "Salary" 
    },
    paymentMode: { 
        type: String, 
        enum: ["Cash", "Bank", "UPI"], 
        default: "Cash" 
    },
    remarks: { type: String }
}, { timestamps: true });

export default mongoose.model("SalaryPayment", salaryPaymentSchema);