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
    const draftKey = String(parsedBody.draftKey || "").trim();
    const isAutosaved = Boolean(parsedBody.isAutosaved);

    if (!title) {
      return { statusCode: 400, body: JSON.stringify({ error: "El título de la lista es obligatorio." }) };
    }

    if (draftKey) {
      const updatedList = await List.findOneAndUpdate(
        { userId, draftKey },
        { title, userId, fields, items, draftKey, isAutosaved },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
      return { statusCode: 201, body: JSON.stringify(updatedList) };
    }

    const newList = new List({ title, userId, fields, items, isAutosaved });
    await newList.save();
    return { statusCode: 201, body: JSON.stringify(newList) };
  } catch (err) {
    return { statusCode: err.statusCode || 400, body: JSON.stringify({ error: err.message }) };
  }
}