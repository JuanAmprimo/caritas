// server/netlify/functions/getLists.js
import List from "../../models/List.js";
import { connectDB } from "./_db.js";
import { requireAuth } from "./_auth.js";

export async function handler(event, context) {
  try {
    await connectDB();
    const userId = requireAuth(event);
    const lists = await List.find({ userId });
    return { statusCode: 200, body: JSON.stringify(lists) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
}
