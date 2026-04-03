import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    // unique: true zaroori hai taaki attendance aur salary isi se map ho
    employeeId: { type: String, unique: true, required: true }, 
    name: { type: String, required: [true, "Name is required"], trim: true },
    fatherName: { type: String, trim: true },
    phone: { type: String, required: [true, "Phone number is required"] },
    emergencyPhone: String,
    aadhar: { 
      type: String, 
      unique: true, 
      required: [true, "Aadhar is required"],
      minlength: 12,
      maxlength: 12
    },
    address: { type: String, trim: true },
    designation: String,
    joiningDate: { type: String, required: true }, // Format: YYYY-MM-DD
    salary: { 
      type: Number, 
      required: [true, "Salary is required"],
      min: 0,
      default: 0 
    },
    bankName: String,
    accountNo: { type: String, trim: true },
    ifscCode: { type: String, trim: true },
    photo: String, 
    password: { type: String, required: [true, "Password is required"] },
    role: {
      type: String,
      enum: ["Admin", "Manager", "Worker", "Operator", "Driver", "Helper"], 
      default: "Worker",
    },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 🛡️ YE HAI FIX: Pehle check karega ki model exist karta hai ya nahi
const Employee = mongoose.models.Employee || mongoose.model("Employee", employeeSchema);

export default Employee;