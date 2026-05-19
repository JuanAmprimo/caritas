// server/netlify/functions/login.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import Log from "../../models/Log.js";
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

    const ip = (event.headers && (event.headers['x-forwarded-for'] || event.headers['client-ip'] || event.headers['x-nf-client-connection-ip'])) || event.requestContext?.identity?.sourceIp || 'unknown';
    // Rate limiting
    loginRateLimit(ip);

    // Verify reCAPTCHA if secret provided
    const recaptchaToken = String(parsedBody.recaptchaToken || "");
    if (process.env.RECAPTCHA_SECRET) {
      if (!recaptchaToken) {
        await Log.create({ ip, email, action: 'login', success: false, reason: 'missing_recaptcha' });
        return { statusCode: 400, body: JSON.stringify({ error: "reCAPTCHA requerido" }) };
      }
      const recRes = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${encodeURIComponent(process.env.RECAPTCHA_SECRET)}&response=${encodeURIComponent(recaptchaToken)}`
      });
      const recJson = await recRes.json();
      if (!recJson.success) {
        await Log.create({ ip, email, action: 'login', success: false, reason: 'recaptcha_failed' });
        return { statusCode: 400, body: JSON.stringify({ error: "reCAPTCHA no válido" }) };
      }
    }

    const user = await User.findOne({ email });
    if (!user) {
      await Log.create({ ip, email, action: 'login', success: false, reason: 'not_found' });
      return { statusCode: 400, body: JSON.stringify({ error: "Usuario no encontrado" }) };
    }

    if (user.isBlocked) {
      await Log.create({ ip, email, action: 'login', success: false, reason: 'blocked' });
      return { statusCode: 403, body: JSON.stringify({ error: "Esta cuenta está bloqueada." }) };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await Log.create({ ip, email, action: 'login', success: false, reason: 'bad_password' });
      return { statusCode: 400, body: JSON.stringify({ error: "Password incorrecta" }) };
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

    user.refreshToken = refreshToken;
    await user.save();
    await Log.create({ ip, email, action: 'login', success: true });

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

// Simple per-IP rate limiter for login (module-scope). For production use a shared store like Redis.
const loginRateMap = new Map();
function loginRateLimit(ip, limit = 5, windowMs = 60 * 1000) {
  const now = Date.now();
  const entry = loginRateMap.get(ip) || { count: 0, first: now };
  if (now - entry.first > windowMs) {
    entry.count = 1;
    entry.first = now;
  } else {
    entry.count += 1;
  }
  loginRateMap.set(ip, entry);
  if (entry.count > limit) {
    const err = new Error('Rate limit exceeded');
    err.statusCode = 429;
    throw err;
  }
}
