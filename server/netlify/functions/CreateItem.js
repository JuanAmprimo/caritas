// server/netlify/functions/createItem.js
import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  userId: String,
  extraFields: Object
});
const Item = mongoose.model("Item", ItemSchema);

let conn = null;
async function connectDB() {
  if (!conn) conn = await mongoose.connect(process.env.MONGO_URI);
  return conn;
}

export async function handler(event, context) {
  try {
    await connectDB();
    const data = JSON.parse(event.body);
    const newItem = new Item(data);
    await newItem.save();
    return { statusCode: 201, body: JSON.stringify(newItem) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
}
