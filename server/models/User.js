import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isBlocked: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  refreshToken: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", UserSchema);
