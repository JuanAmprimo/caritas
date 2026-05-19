// server/netlify/functions/register.js
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../../models/User.js";
import Log from "../../models/Log.js";
import { connectDB } from "./_db.js";

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

    // Rate limiting (simple in-memory per-IP, per-minute)
    const ip = (event.headers && (event.headers['x-forwarded-for'] || event.headers['client-ip'] || event.headers['x-nf-client-connection-ip'])) || event.requestContext?.identity?.sourceIp || 'unknown';
    registerRateLimit(ip);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isBlocked) {
        await Log.create({ ip, email, action: 'register', success: false, reason: 'email_blocked' });
        return { statusCode: 403, body: JSON.stringify({ error: "Este correo está bloqueado y no puede registrarse." }) };
      }
      return { statusCode: 400, body: JSON.stringify({ error: "El email ya esta registrado" }) };
    }

    // If server configured with RECAPTCHA_SECRET, verify token
    const recaptchaToken = String(parsedBody.recaptchaToken || "");
    if (process.env.RECAPTCHA_SECRET) {
      if (!recaptchaToken) {
        await Log.create({ ip, email, action: 'register', success: false, reason: 'missing_recaptcha' });
        return { statusCode: 400, body: JSON.stringify({ error: "reCAPTCHA requerido" }) };
      }
      const recRes = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${encodeURIComponent(process.env.RECAPTCHA_SECRET)}&response=${encodeURIComponent(recaptchaToken)}`
      });
      const recJson = await recRes.json();
      if (!recJson.success) {
        await Log.create({ ip, email, action: 'register', success: false, reason: 'recaptcha_failed' });
        return { statusCode: 400, body: JSON.stringify({ error: "reCAPTCHA no válido" }) };
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Create verification token
    const verificationToken = crypto.randomBytes(24).toString('hex');
    const newUser = new User({ username, email, password: hashedPassword, isVerified: false, verificationToken });
    try {
      await newUser.save();

      // Send verification email if SMTP configured
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.APP_URL) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });

        const verifyUrl = `${process.env.APP_URL}/.netlify/functions/verifyEmail?token=${verificationToken}`;
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: 'Verifica tu cuenta',
          text: `Por favor verifica tu cuenta visitando: ${verifyUrl}`,
          html: `<p>Por favor verifica tu cuenta haciendo clic <a href="${verifyUrl}">aquí</a>.</p>`
        });
      }

      await Log.create({ ip, email, action: 'register', success: true });

      return { statusCode: 201, body: JSON.stringify({ message: "Usuario registrado con exito. Revisa tu email para verificar la cuenta." }) };
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

// Simple in-memory rate limiter (module-scope). Note: serverless functions are ephemeral; for robust limits use Redis.
const rateMap = new Map();
function registerRateLimit(ip, limit = 5, windowMs = 60 * 1000) {
  const now = Date.now();
  const entry = rateMap.get(ip) || { count: 0, first: now };
  if (now - entry.first > windowMs) {
    entry.count = 1;
    entry.first = now;
  } else {
    entry.count += 1;
  }
  rateMap.set(ip, entry);
  if (entry.count > limit) {
    const err = new Error('Rate limit exceeded');
    err.statusCode = 429;
    throw err;
  }
}
