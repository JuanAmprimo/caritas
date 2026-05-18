// server/netlify/functions/deleteList.js
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
    const id = event.path.split("/").pop();
    await List.findByIdAndDelete(id);
    return { statusCode: 200, body: JSON.stringify({ message: "Lista eliminada" }) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
}
