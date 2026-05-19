// server/netlify/functions/deleteDonation.js
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

    const donation = await Donation.findById(id);
    if (!donation) {
      return { statusCode: 404, body: JSON.stringify({ error: "Donación no encontrada" }) };
    }
    if (donation.userId.toString() !== userId.toString()) {
      return { statusCode: 403, body: JSON.stringify({ error: "No tienes permiso para eliminar esta donación" }) };
    }
    await Donation.findByIdAndDelete(id);
    return { statusCode: 200, body: JSON.stringify({ message: "Donación eliminada" }) };
  } catch (err) {
    return { statusCode: err.statusCode || 400, body: JSON.stringify({ error: err.message }) };
  }
}
