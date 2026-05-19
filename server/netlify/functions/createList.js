// server/netlify/functions/createList.js
import List from "../../models/List.js";
import { connectDB } from "./_db.js";
import { requireAuth } from "./_auth.js";

export async function handler(event, context) {
  try {
    const userId = requireAuth(event);
    await connectDB();

    let parsedBody = {};
    try {
      parsedBody = JSON.parse(event.body || "{}");
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: "JSON invalido en el cuerpo de la solicitud." }) };
    }

    const title = String(parsedBody.title || "").trim();
    const fields = Array.isArray(parsedBody.fields) ? parsedBody.fields : [];
    const items = Array.isArray(parsedBody.items) ? parsedBody.items : [];

    if (!title) {
      return { statusCode: 400, body: JSON.stringify({ error: "El título de la lista es obligatorio." }) };
    }

    const newList = new List({ title, userId, fields, items });
    await newList.save();
    return { statusCode: 201, body: JSON.stringify(newList) };
  } catch (err) {
    return { statusCode: err.statusCode || 400, body: JSON.stringify({ error: err.message }) };
  }
}
