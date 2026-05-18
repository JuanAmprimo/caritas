// server/netlify/functions/register.js
import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import { connectDB } from "./_db.js";

export async function handler(event, context) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Metodo no permitido. Usa POST con JSON en el cuerpo." }) };
    }

    const { username, email, password } = JSON.parse(event.body || "{}");

    if (!username || !email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: "Todos los campos son obligatorios" }) };
    }

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { statusCode: 400, body: JSON.stringify({ error: "El email ya esta registrado" }) };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    return { statusCode: 201, body: JSON.stringify({ message: "Usuario registrado con exito" }) };
  } catch (err) {
    return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message }) };
  }
}
