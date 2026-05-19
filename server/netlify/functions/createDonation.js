// server/netlify/functions/createDonation.js
import Donation from "../../models/Donation.js";
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
      return { statusCode: 400, body: JSON.stringify({ error: "JSON invalido en el cuerpo de la solicitud." }) };
    }

    const name = String(parsedBody.name || "").trim();
    const price = Number(parsedBody.price);
    const quantity = parsedBody.quantity !== undefined ? Number(parsedBody.quantity) : 1;
    const size = parsedBody.size ? String(parsedBody.size).trim() : undefined;
    const description = parsedBody.description ? String(parsedBody.description).trim() : undefined;
    const image = parsedBody.image ? String(parsedBody.image).trim() : undefined;

    if (!name) {
      return { statusCode: 400, body: JSON.stringify({ error: "El nombre de la donación es obligatorio." }) };
    }
    if (Number.isNaN(price) || price < 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "El precio debe ser un numero válido mayor o igual a 0." }) };
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { statusCode: 400, body: JSON.stringify({ error: "La cantidad debe ser un entero positivo." }) };
    }

    const newDonation = new Donation({
      name,
      price,
      size,
      quantity,
      description,
      image,
      userId,
    });
    await newDonation.save();
    return { statusCode: 201, body: JSON.stringify(newDonation) };
  } catch (err) {
    return { statusCode: err.statusCode || 400, body: JSON.stringify({ error: err.message }) };
  }
}
