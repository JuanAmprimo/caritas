import mongoose from "mongoose";
import Document from "../../models/Document.js";
import { connectDB } from "./_db.js";
import { requireAuth } from "./_auth.js";

export async function handler(event, context) {
  try {
    const userId = requireAuth(event);
    await connectDB();

    const id = event.path.split("/").pop();
    if (!mongoose.isValidObjectId(id)) {
      return { statusCode: 400, body: JSON.stringify({ error: "ID de documento inválido" }) };
    }

    const document = await Document.findById(id);
    if (!document) {
      return { statusCode: 404, body: JSON.stringify({ error: "Documento no encontrado" }) };
    }
    if (document.userId.toString() !== userId.toString()) {
      return { statusCode: 403, body: JSON.stringify({ error: "No tienes permiso para ver este documento" }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        _id: document._id,
        name: document.name,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        createdAt: document.createdAt,
        data: document.data.toString("base64"),
      }),
    };
  } catch (err) {
    return { statusCode: err.statusCode || 400, body: JSON.stringify({ error: err.message }) };
  }
}
