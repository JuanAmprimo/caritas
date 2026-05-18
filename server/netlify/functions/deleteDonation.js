// server/netlify/functions/deleteDonation.js
import Donation from "../../models/Donation.js";
import { connectDB } from "./_db.js";
import { requireAuth } from "./_auth.js";

export async function handler(event, context) {
  try {
    await connectDB();
    const userId = requireAuth(event);
    const id = event.path.split("/").pop();
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
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
}
