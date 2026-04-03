import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, unique: true, sparse: true },
    name: { type: String, required: [true, "Name is required"], trim: true },
    fatherName: { type: String, trim: true },
    phone: { type: String, required: [true, "Phone number is required"] },
    emergencyPhone: String,
    aadhar: { 
      type: String, 
      unique: true, 
      required: [true, "Aadhar is required"],
      minlength: [12, "Aadhar must be 12 digits"],
      maxlength: [12, "Aadhar must be 12 digits"]
    },
    address: { type: String, trim: true },
    designation: String,
    joiningDate: { type: Date, default: Date.now }, 
    salary: { 
      type: Number, 
      required: [true, "Salary is required"],
      min: [0, "Salary cannot be negative"],
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

// ✨ Yahan Change Hai: Pehle variable mein store karein phir default export karein
const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;