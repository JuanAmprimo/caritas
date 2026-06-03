import Document from "../../models/Document.js";
import { connectDB } from "./_db.js";
import { requireAuth } from "./_auth.js";

export async function handler(event, context) {
  try {
    const userId = requireAuth(event);
    await connectDB();

    const documents = await Document.find({ userId })
      .sort({ createdAt: -1 })
      .select("name originalName mimeType size createdAt");

    return { statusCode: 200, body: JSON.stringify(documents) };
  } catch (err) {
    return { statusCode: err.statusCode || 400, body: JSON.stringify({ error: err.message }) };
  }
}
