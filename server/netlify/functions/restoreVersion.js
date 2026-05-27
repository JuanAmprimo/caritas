// server/netlify/functions/restoreVersion.js
import mongoose from "mongoose";
import List from "../../models/List.js";
import { connectDB } from "./_db.js";
import { requireAuth } from "./_auth.js";

export async function handler(event, context) {
  try {
    const userId = requireAuth(event);
    await connectDB();

    const pathParts = event.path.split("/");
    const id = pathParts[pathParts.length - 2];
    const versionIndex = Number(pathParts[pathParts.length - 1]);

    if (!mongoose.isValidObjectId(id)) {
      return { statusCode: 400, body: JSON.stringify({ error: "ID de lista inválido" }) };
    }
    if (isNaN(versionIndex)) {
      return { statusCode: 400, body: JSON.stringify({ error: "Índice de versión inválido" }) };
    }

    const list = await List.findById(id);
    if (!list) {
      return { statusCode: 404, body: JSON.stringify({ error: "Lista no encontrada" }) };
    }
    if (list.userId.toString() !== userId.toString()) {
      return { statusCode: 403, body: JSON.stringify({ error: "No tienes permiso para modificar esta lista" }) };
    }

    if (!list.versions || versionIndex < 0 || versionIndex >= list.versions.length) {
      return { statusCode: 404, body: JSON.stringify({ error: "Versión no encontrada" }) };
    }

    const version = list.versions[versionIndex];

    // Guardar versión actual como snapshot antes de restaurar
    const currentSnapshot = {
      title: list.title,
      fields: list.fields,
      items: list.items,
      timestamp: new Date(),
    };

    // Restaurar: volver a la versión seleccionada
    list.versions.push(currentSnapshot);
    list.title = version.title;
    list.fields = version.fields;
    list.items = version.items;
    list.currentVersion += 1;

    await list.save();

    return { statusCode: 200, body: JSON.stringify(list) };
  } catch (err) {
    return { statusCode: err.statusCode || 400, body: JSON.stringify({ error: err.message }) };
  }
}