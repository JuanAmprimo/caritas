// server/netlify/functions/getLists.js
import List from "../../models/List.js";
import { connectDB } from "./_db.js";
import { requireAuth } from "./_auth.js";

export async function handler(event, context) {
  try {
    const userId = requireAuth(event);
    await connectDB();
    const lists = await List.find({ userId });
    const normalizedLists = lists.map((list) => {
      const data = list.toObject();
      if (!Array.isArray(data.currentFields) || (data.currentFields.length === 0 && Array.isArray(data.fields) && data.fields.length > 0)) {
        data.currentFields = Array.isArray(data.fields) ? data.fields : [];
      }
      if (!Array.isArray(data.currentItems) || (data.currentItems.length === 0 && Array.isArray(data.items) && data.items.length > 0)) {
        data.currentItems = Array.isArray(data.items) ? data.items : [];
      }
      if (!Array.isArray(data.versionHistory)) {
        data.versionHistory = [];
      }
      return data;
    });
    return { statusCode: 200, body: JSON.stringify(normalizedLists) };
  } catch (err) {
    return { statusCode: err.statusCode || 400, body: JSON.stringify({ error: err.message }) };
  }
}
