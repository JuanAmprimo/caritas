// server/netlify/functions/updateDonation.js
import mongoose from "mongoose";
import Donation from "../../models/Donation.js";
import { connectDB } from "./_db.js";
import { requireAuth } from "./_auth.js";

export async function handler(event, context) {
  try {
    const userId = requireAuth(event);
    await connectDB();

    const id = event.path.split("/").pop();
    if (!mongoose.isValidObjectId(id)) {
      return { statusCode: 400, body: JSON.stringify({ error: "ID de donación inválido" }) };
    }

    let parsedBody = {};
    try {
      parsedBody = JSON.parse(event.body || "{}");
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: "JSON invalido en el cuerpo de la solicitud." }) };
    }

    const donation = await Donation.findById(id);
    if (!donation) {
      return { statusCode: 404, body: JSON.stringify({ error: "Donación no encontrada" }) };
    }
    if (donation.userId.toString() !== userId.toString()) {
      return { statusCode: 403, body: JSON.stringify({ error: "No tienes permiso para modificar esta donación" }) };
    }

    const updates = {};
    if (typeof parsedBody.name === "string" && parsedBody.name.trim()) updates.name = parsedBody.name.trim();
    if (parsedBody.price !== undefined) {
      const price = Number(parsedBody.price);
      if (Number.isNaN(price) || price < 0) {
        return { statusCode: 400, body: JSON.stringify({ error: "El precio debe ser un numero válido mayor o igual a 0." }) };
      }
      updates.price = price;
    }
    if (parsedBody.quantity !== undefined) {
      const quantity = Number(parsedBody.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return { statusCode: 400, body: JSON.stringify({ error: "La cantidad debe ser un entero positivo." }) };
      }
      updates.quantity = quantity;
    }
    if (typeof parsedBody.size === "string") updates.size = parsedBody.size.trim();
    if (typeof parsedBody.description === "string") updates.description = parsedBody.description.trim();
    if (typeof parsedBody.image === "string") updates.image = parsedBody.image.trim();

    if (Object.keys(updates).length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "No se proporcionaron campos válidos para actualizar." }) };
    }

    const updatedDonation = await Donation.findByIdAndUpdate(id, updates, { new: true });
    return { statusCode: 200, body: JSON.stringify(updatedDonation) };
  } catch (err) {
    return { statusCode: err.statusCode || 400, body: JSON.stringify({ error: err.message }) };
  }
}
