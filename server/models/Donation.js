import mongoose from "mongoose";

const DonationSchema = new mongoose.Schema({
  name: String,
  price: Number,
  size: String,
  quantity: Number,
  description: String,
  image: String,
  userId: String // cada usuario ve sus propias donaciones
});

export default mongoose.model("Donation", DonationSchema);
