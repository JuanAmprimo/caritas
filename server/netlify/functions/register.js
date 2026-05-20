// server/netlify/functions/register.js
import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import Log from "../../models/Log.js";
import { connectDB } from "./_db.js";
import { checkRateLimit } from "../../middleware/rateLimit.js";

export async function handler(event, context) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Metodo no permitido. Usa POST con JSON en el cuerpo." }) };
    }

    let parsedBody = {};
    try {
      parsedBody = JSON.parse(event.body || "{}");
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: "JSON invalido en el cuerpo de la solicitud." }) };
    }

    const username = String(parsedBody.username || "").trim();
    const email = String(parsedBody.email || "").trim().toLowerCase();
    const password = String(parsedBody.password || "");

    if (!username || !email || !password || !parsedBody.confirmEmail) {
      return { statusCode: 400, body: JSON.stringify({ error: "Todos los campos son obligatorios" }) };
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return { statusCode: 400, body: JSON.stringify({ error: "Formato de email inválido" }) };
    }

    if (email !== String(parsedBody.confirmEmail || "").trim().toLowerCase()) {
      return { statusCode: 400, body: JSON.stringify({ error: "Los emails no coinciden" }) };
    }

    // Password strength: min 8 chars, at least one uppercase, one number, one symbol
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
      return { statusCode: 400, body: JSON.stringify({ error: "La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, un número y un símbolo" }) };
    }

    await connectDB();

    // Rate limiting (shared)
    const ip = (event.headers && (event.headers['x-forwarded-for'] || event.headers['client-ip'] || event.headers['x-nf-client-connection-ip'])) || event.requestContext?.identity?.sourceIp || 'unknown';
    await checkRateLimit(ip, 'register');

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isBlocked) {
        await Log.create({ ip, email, action: 'register', success: false, reason: 'email_blocked' });
        return { statusCode: 403, body: JSON.stringify({ error: "Este correo está bloqueado y no puede registrarse." }) };
      }
      return { statusCode: 400, body: JSON.stringify({ error: "El email ya esta registrado" }) };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    try {
      await newUser.save();
      await Log.create({ ip, email, action: 'register', success: true });
      return { statusCode: 201, body: JSON.stringify({ message: "Usuario registrado con exito." }) };
    } catch (saveErr) {
      // Manejar error de clave única en Mongo (email duplicado)
      if (saveErr && saveErr.code === 11000) {
        await Log.create({ ip, email, action: 'register', success: false, reason: 'duplicate_key' });
        return { statusCode: 400, body: JSON.stringify({ error: "El email ya esta registrado" }) };
      }
      throw saveErr;
    }
  } catch (err) {
    return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message }) };
  }
}
