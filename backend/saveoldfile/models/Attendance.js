import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  name: { type: String, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  status: { 
    type: String, 
    enum: ["Present", "Absent", "Half-Day", "Leave"], 
    required: true 
  },
  timeIn: { type: String }, // Optional: Shift start
  timeOut: { type: String }, // Optional: Shift end
}, { timestamps: true });

// Ek employee ki ek din mein ek hi entry ho sakti hai
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);