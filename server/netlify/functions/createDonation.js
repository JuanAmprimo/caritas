// server/netlify/functions/createDonation.js
import Donation from "../../models/Donation.js";
import { connectDB } from "./_db.js";
import { requireAuth } from "./_auth.js";

export async function handler(event, context) {
  try {
    await connectDB();
    const userId = requireAuth(event);
    const data = JSON.parse(event.body);
    const newDonation = new Donation({ ...data, userId });
    await newDonation.save();
    return { statusCode: 201, body: JSON.stringify(newDonation) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
}
