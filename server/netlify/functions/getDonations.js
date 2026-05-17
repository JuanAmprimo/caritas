// server/netlify/functions/getDonations.js
import mongoose from "mongoose";
import Donation from "../models/Donation.js";

let conn = null;
async function connectDB() {
  if (!conn) conn = await mongoose.connect(process.env.MONGO_URI);
  return conn;
}

export async function handler(event, context) {
  try {
    await connectDB();
    const userId = event.queryStringParameters.userId;
    const donations = await Donation.find({ userId });
    return { statusCode: 200, body: JSON.stringify(donations) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
