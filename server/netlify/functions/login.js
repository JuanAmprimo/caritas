// server/netlify/functions/login.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";

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
    const { email, password } = JSON.parse(event.body);

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
      body: JSON.stringify({ message: "Login exitoso", accessToken, refreshToken })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
