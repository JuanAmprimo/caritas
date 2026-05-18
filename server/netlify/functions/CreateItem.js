// server/netlify/functions/createItem.js
import mongoose from "mongoose";
import { connectDB } from "./_db.js";
import { requireAuth } from "./_auth.js";

const ItemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  userId: String,
  extraFields: Object
});
const Item = mongoose.model("Item", ItemSchema);

export async function handler(event, context) {
  try {
    await connectDB();
    const userId = requireAuth(event);
    const data = JSON.parse(event.body);
    const newItem = new Item({ ...data, userId });
    await newItem.save();
    return { statusCode: 201, body: JSON.stringify(newItem) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
}
