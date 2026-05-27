// server/netlify/functions/getVersions.js
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

    // Devolver versiones en orden inverso (más reciente primero)
    const versions = (list.versions || []).reverse().map((v, i) => ({
      versionIndex: list.versions.length - 1 - i,
      title: v.title,
      fields: v.fields,
      items: v.items,
      timestamp: v.timestamp,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        currentVersion: list.currentVersion,
        currentTitle: list.title,
        currentFields: list.fields,
        currentItems: list.items,
        versions,
      }),
    };
  } catch (err) {
    return { statusCode: err.statusCode || 400, body: JSON.stringify({ error: err.message }) };
  }
}