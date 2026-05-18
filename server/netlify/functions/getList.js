// server/netlify/functions/getLists.js
import mongoose from "mongoose";
import List from "../../models/List.js";

let conn = null;
async function connectDB() {
  if (!conn) conn = await mongoose.connect(process.env.MONGO_URI);
  return conn;
}

export async function handler(event, context) {
  try {
    await connectDB();
    const { userId } = event.queryStringParameters;
    const lists = await List.find({ userId });
    return { statusCode: 200, body: JSON.stringify(lists) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
}
