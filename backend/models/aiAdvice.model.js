import mongoose from "mongoose";

const aiAdviceSchema = new mongoose.Schema(
  {
    receive: Number,
    pay: Number,
    net: Number,
    advice: String
  },
  { timestamps: true }
);

export default mongoose.model("AIAdvice", aiAdviceSchema);
