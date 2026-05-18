// server/netlify/functions/delete.js
import User from "../../models/User.js";
import List from "../../models/List.js";
import { connectDB } from "./_db.js";
import { requireAuth } from "./_auth.js";

export async function handler(event, context) {
  try {
    await connectDB();
    const userId = requireAuth(event);

    const user = await User.findById(userId);
    if (!user) {
      return { statusCode: 404, body: JSON.stringify({ error: "Usuario no encontrado" }) };
    }

    await List.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    return { statusCode: 200, body: JSON.stringify({ message: "Cuenta eliminada permanentemente ✅" }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Error al eliminar la cuenta" }) };
  }
}
