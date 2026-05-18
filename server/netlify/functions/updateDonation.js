// server/netlify/functions/updateDonation.js
import Donation from "../../models/Donation.js";
import { connectDB } from "./_db.js";
import { requireAuth } from "./_auth.js";

export async function handler(event, context) {
  try {
    const userId = requireAuth(event);
    await connectDB();
    const id = event.path.split("/").pop(); // obtiene el ID de la URL
    const data = JSON.parse(event.body);
    const donation = await Donation.findById(id);
    if (!donation) {
      return { statusCode: 404, body: JSON.stringify({ error: "Donación no encontrada" }) };
    }
    if (donation.userId.toString() !== userId.toString()) {
      return { statusCode: 403, body: JSON.stringify({ error: "No tienes permiso para modificar esta donación" }) };
    }
    const updatedDonation = await Donation.findByIdAndUpdate(id, data, { new: true });
    return { statusCode: 200, body: JSON.stringify(updatedDonation) };
  } catch (err) {
    return { statusCode: err.statusCode || 400, body: JSON.stringify({ error: err.message }) };
  }
}
