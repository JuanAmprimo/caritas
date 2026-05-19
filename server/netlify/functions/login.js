// server/netlify/functions/login.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import { connectDB } from "./_db.js";

export async function handler(event, context) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Metodo no permitido. Usa POST con JSON en el cuerpo." }) };
    }

    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Falta el cuerpo de la solicitud. Envia email y password en JSON." }) };
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: "JSON invalido en el cuerpo de la solicitud." }) };
    }

    const { email, password } = parsedBody;

    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: "Email y password son obligatorios." }) };
    }

    if (!process.env.JWT_SECRET) {
      const err = new Error("JWT_SECRET no esta configurada en Netlify");
      err.statusCode = 500;
      throw err;
    }

    if (!process.env.JWT_REFRESH_SECRET) {
      const err = new Error("JWT_REFRESH_SECRET no esta configurada en Netlify");
      err.statusCode = 500;
      throw err;
    }

    await connectDB();

    const user = await User.findOne({ email });
    if (!user) return { statusCode: 400, body: JSON.stringify({ error: "Usuario no encontrado" }) };

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return { statusCode: 400, body: JSON.stringify({ error: "Password incorrecta" }) };

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

    user.refreshToken = refreshToken;
    await user.save();

    const cookieOptions = [
      `refreshToken=${refreshToken}`,
      "HttpOnly",
      "Path=/",
      "Max-Age=604800",
      "SameSite=Strict",
    ];
    if (process.env.NODE_ENV === "production") {
      cookieOptions.push("Secure");
    }

    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": cookieOptions.join("; "),
      },
      body: JSON.stringify({ message: "Login exitoso", accessToken, username: user.username, userId: user._id }),
    };
  } catch (err) {
    return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message }) };
  }
}
