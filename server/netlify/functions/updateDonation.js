// server/netlify/functions/updateDonation.js
import mongoose from "mongoose";
import Donation from "../../models/Donation.js";

let conn = null;
async function connectDB() {
  if (!conn) conn = await mongoose.connect(process.env.MONGO_URI);
  return conn;
}

export async function handler(event, context) {
  try {
    await connectDB();
    const id = event.path.split("/").pop(); // obtiene el ID de la URL
    const data = JSON.parse(event.body);
    const updatedDonation = await Donation.findByIdAndUpdate(id, data, { new: true });
    return { statusCode: 200, body: JSON.stringify(updatedDonation) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
}
