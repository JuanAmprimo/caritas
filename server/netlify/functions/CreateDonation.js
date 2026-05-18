// server/netlify/functions/createDonation.js
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
    const data = JSON.parse(event.body);
    const newDonation = new Donation(data);
    await newDonation.save();
    return { statusCode: 201, body: JSON.stringify(newDonation) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
}
