import mongoose from "mongoose";

const LogSchema = new mongoose.Schema({
  ip: { type: String },
  email: { type: String },
  action: { type: String, enum: ["register", "login"], required: true },
  success: { type: Boolean, default: false },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Log", LogSchema);
