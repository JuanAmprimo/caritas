// server/netlify/functions/updateList.js
import mongoose from "mongoose";
import List from "../../models/List.js";
import { connectDB } from "./_db.js";
import { requireAuth } from "./_auth.js";

export async function handler(event, context) {
  try {
    const userId = requireAuth(event);
    await connectDB();

    const id = event.path.split("/").pop();
    if (!mongoose.isValidObjectId(id)) {
      return { statusCode: 400, body: JSON.stringify({ error: "ID de lista inválido" }) };
    }

    let parsedBody = {};
    try {
      parsedBody = JSON.parse(event.body || "{}");
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: "JSON invalido en el cuerpo de la solicitud." }) };
    }

    const list = await List.findById(id);
    if (!list) {
      return { statusCode: 404, body: JSON.stringify({ error: "Lista no encontrada" }) };
    }
    if (list.userId.toString() !== userId.toString()) {
      return { statusCode: 403, body: JSON.stringify({ error: "No tienes permiso para modificar esta lista" }) };
    }

    const updates = {};
    if (typeof parsedBody.title === "string" && parsedBody.title.trim()) updates.title = parsedBody.title.trim();
    if (Array.isArray(parsedBody.fields)) updates.fields = parsedBody.fields;
    if (Array.isArray(parsedBody.items)) updates.items = parsedBody.items;

    if (Object.keys(updates).length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "No se proporcionaron campos válidos para actualizar." }) };
    }

    const updated = await List.findByIdAndUpdate(id, updates, { new: true });
    return { statusCode: 200, body: JSON.stringify(updated) };
  } catch (err) {
    return { statusCode: err.statusCode || 400, body: JSON.stringify({ error: err.message }) };
  }
}
