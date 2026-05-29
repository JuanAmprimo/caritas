// server/netlify/functions/updateList.js
import mongoose from "mongoose";
import List from "../../models/List.js";
import { connectDB } from "./_db.js";
import { requireAuth } from "./_auth.js";
import { createListSnapshot, hasSameSnapshotContent } from "./_listHistory.js";

export async function handler(event, context) {
  try {
    const userId = requireAuth(event);
    await connectDB();

    const id = event.path.split("/").pop();
    if (!mongoose.isValidObjectId(id)) {
      return { statusCode: 400, body: JSON.stringify({ error: "ID de lista invalido" }) };
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

    const hasTitle = typeof parsedBody.title === "string" && parsedBody.title.trim();
    const hasFields = Array.isArray(parsedBody.fields);
    const hasItems = Array.isArray(parsedBody.items);
    const hasAutosavedFlag = typeof parsedBody.isAutosaved === "boolean";
    const shouldCreateSnapshot = Boolean(parsedBody.createSnapshot);

    if (!hasTitle && !hasFields && !hasItems && !hasAutosavedFlag && !shouldCreateSnapshot) {
      return { statusCode: 400, body: JSON.stringify({ error: "No se proporcionaron campos validos para actualizar." }) };
    }

    const nextTitle = hasTitle ? parsedBody.title.trim() : list.title;
    const nextFields = hasFields ? parsedBody.fields : (list.currentFields?.length ? list.currentFields : list.fields || []);
    const nextItems = hasItems ? parsedBody.items : (list.currentItems?.length ? list.currentItems : list.items || []);
    const nextIsAutosaved = hasAutosavedFlag ? parsedBody.isAutosaved : list.isAutosaved;

    list.title = nextTitle;
    list.fields = nextFields;
    list.items = nextItems;
    list.currentFields = nextFields;
    list.currentItems = nextItems;
    list.isAutosaved = nextIsAutosaved;
    list.updatedAt = new Date();

    if (shouldCreateSnapshot && !nextIsAutosaved) {
      const history = Array.isArray(list.versionHistory) ? list.versionHistory : [];
      const lastSnapshot = history[history.length - 1];

      if (!hasSameSnapshotContent(lastSnapshot, nextTitle, nextFields, nextItems)) {
        list.versionHistory.push(createListSnapshot(nextTitle, nextFields, nextItems));
      }
    }

    await list.save();
    return { statusCode: 200, body: JSON.stringify(list) };
  } catch (err) {
    return { statusCode: err.statusCode || 400, body: JSON.stringify({ error: err.message }) };
  }
}
