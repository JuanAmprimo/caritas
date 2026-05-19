import User from "../../models/User.js";
import { connectDB } from "./_db.js";

export async function handler(event, context) {
  try {
    const token = (event.queryStringParameters && event.queryStringParameters.token) || null;
    if (!token) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Token faltante' }) };
    }

    await connectDB();
    const user = await User.findOne({ verificationToken: token });
    if (!user) return { statusCode: 404, body: JSON.stringify({ error: 'Token inválido o usuario no encontrado' }) };

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    return { statusCode: 200, body: JSON.stringify({ message: 'Cuenta verificada. Ya puedes iniciar sesión.' }) };
  } catch (err) {
    return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message || 'Error verificando token' }) };
  }
}
