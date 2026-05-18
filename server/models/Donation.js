import mongoose from "mongoose";

const DonationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  size: String,
  quantity: { type: Number, default: 1 },
  description: String,
  image: String,
  userId: { type: String, required: true }
});

export default mongoose.model("Donation", DonationSchema);
