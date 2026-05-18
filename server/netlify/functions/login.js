// server/netlify/functions/login.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../../models/User.js";

let conn = null;
async function connectDB() {
  if (!conn) {
    conn = await mongoose.connect(process.env.MONGO_URI);
  }
  return conn;
}

export async function handler(event, context) {
  try {
    await connectDB();

    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido. Usa POST con JSON en el cuerpo." }) };
    }

    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Falta el cuerpo de la solicitud. Envía email y password en JSON." }) };
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (parseErr) {
      return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido en el cuerpo de la solicitud." }) };
    }

    const { email, password } = parsedBody;

    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: "Email y password son obligatorios." }) };
    }

    const user = await User.findOne({ email });
    if (!user) return { statusCode: 400, body: JSON.stringify({ error: "Usuario no encontrado" }) };

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return { statusCode: 400, body: JSON.stringify({ error: "Contraseña incorrecta" }) };

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

    user.refreshToken = refreshToken;
    await user.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Login exitoso", accessToken, refreshToken, username: user.username, userId: user._id })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
