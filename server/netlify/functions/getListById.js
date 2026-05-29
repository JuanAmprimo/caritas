// server/netlify/functions/getListById.js
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

    const list = await List.findById(id);
    if (!list) {
      return { statusCode: 404, body: JSON.stringify({ error: "Lista no encontrada" }) };
    }
    if (list.userId.toString() !== userId.toString()) {
      return { statusCode: 403, body: JSON.stringify({ error: "No tienes permiso para ver esta lista" }) };
    }
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
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: err.statusCode || 400, body: JSON.stringify({ error: err.message }) };
  }
}
