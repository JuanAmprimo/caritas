import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isBlocked: { type: Boolean, default: false },
  refreshToken: { type: String, default: null }, // Legacy: used before sessions were stored per device.
  refreshTokens: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", UserSchema);
