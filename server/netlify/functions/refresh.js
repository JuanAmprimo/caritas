// server/netlify/functions/refresh.js
import jwt from "jsonwebtoken";
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
    const { refreshToken } = JSON.parse(event.body);
    if (!refreshToken) return { statusCode: 401, body: JSON.stringify({ error: "Refresh token requerido" }) };

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return { statusCode: 403, body: JSON.stringify({ error: "Refresh token inválido" }) };
    }

    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });

    return { statusCode: 200, body: JSON.stringify({ message: "Access token renovado", accessToken: newAccessToken }) };
  } catch {
    return { statusCode: 403, body: JSON.stringify({ error: "Refresh token inválido o expirado" }) };
  }
}
