import Document from "../../models/Document.js";
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
      return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido en el cuerpo de la solicitud." }) };
    }

    const originalName = String(parsedBody.originalName || "").trim();
    const name = String(parsedBody.name || originalName || "").trim();
    const mimeType = String(parsedBody.mimeType || "").trim();
    const base64Data = String(parsedBody.data || "").trim();

    if (!originalName || !mimeType || !base64Data) {
      return { statusCode: 400, body: JSON.stringify({ error: "Faltan datos para subir el documento." }) };
    }

    const buffer = Buffer.from(base64Data, "base64");
    const document = new Document({
      userId,
      name,
      originalName,
      mimeType,
      data: buffer,
      size: buffer.length,
    });
    await document.save();

    return {
      statusCode: 201,
      body: JSON.stringify({
        _id: document._id,
        name: document.name,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        createdAt: document.createdAt,
      }),
    };
  } catch (err) {
    return { statusCode: err.statusCode || 400, body: JSON.stringify({ error: err.message }) };
  }
}
