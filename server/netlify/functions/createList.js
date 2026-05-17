// server/netlify/functions/createList.js
import mongoose from "mongoose";
import List from "../models/List.js";

let conn = null;
async function connectDB() {
  if (!conn) conn = await mongoose.connect(process.env.MONGO_URI);
  return conn;
}

export async function handler(event, context) {
  try {
    await connectDB();
    const { title, fields, items, userId } = JSON.parse(event.body);
    const newList = new List({ title, userId, fields, items });
    await newList.save();
    return { statusCode: 201, body: JSON.stringify(newList) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
}
