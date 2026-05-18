// server/netlify/functions/createList.js
import List from "../../models/List.js";
import { connectDB } from "./_db.js";
import { requireAuth } from "./_auth.js";

export async function handler(event, context) {
  try {
    await connectDB();
    const userId = requireAuth(event);
    const { title, fields, items } = JSON.parse(event.body);

    if (!title) {
      return { statusCode: 400, body: JSON.stringify({ error: "El título de la lista es obligatorio." }) };
    }

    const newList = new List({ title, userId, fields, items });
    await newList.save();
    return { statusCode: 201, body: JSON.stringify(newList) };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
}
