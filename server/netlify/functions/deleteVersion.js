import mongoose from "mongoose";
import List from "../../models/List.js";
import { connectDB } from "./_db.js";
import { requireAuth } from "./_auth.js";

export async function handler(event, context) {
  try {
    const userId = requireAuth(event);
    await connectDB();

    const parts = event.path.replace(/\/\.netlify\/functions\/deleteVersion\//, "").split("/");
    const listId = parts[0];
    const versionId = parts[1];

    if (!mongoose.isValidObjectId(listId)) {
      return { statusCode: 400, body: JSON.stringify({ error: "ID de lista invalido" }) };
    }

    const list = await List.findById(listId);
    if (!list) {
      return { statusCode: 404, body: JSON.stringify({ error: "Lista no encontrada" }) };
    }
    if (list.userId.toString() !== userId.toString()) {
      return { statusCode: 403, body: JSON.stringify({ error: "No tienes permiso para modificar esta lista" }) };
    }

    const history = Array.isArray(list.versionHistory) ? list.versionHistory : [];
    const initialLength = history.length;

    // Filtrar la versión a eliminar
    list.versionHistory = history.filter((v) => {
      const vId = v._id ? v._id.toString() : null;
      return vId !== versionId && v.savedAt?.toISOString() !== versionId && v.savedAt !== versionId;
    });

    if (list.versionHistory.length === initialLength) {
      return { statusCode: 404, body: JSON.stringify({ error: "Version no encontrada" }) };
    }

    list.updatedAt = new Date();
    await list.save();

    return { statusCode: 200, body: JSON.stringify(list) };
  } catch (err) {
    return { statusCode: err.statusCode || 400, body: JSON.stringify({ error: err.message }) };
  }
}