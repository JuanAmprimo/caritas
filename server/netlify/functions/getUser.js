// server/netlify/functions/getUser.js
import User from "../../models/User.js";
import { connectDB } from "./_db.js";
import { requireAuth } from "./_auth.js";

export async function handler(event, context) {
  try {
    const userId = requireAuth(event);
    await connectDB();

    const user = await User.findById(userId).select("username email");
    if (!user) {
      return { statusCode: 404, body: JSON.stringify({ error: "Usuario no encontrado" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ user }) };
  } catch (err) {
    return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message || "Error al obtener usuario" }) };
  }
}
