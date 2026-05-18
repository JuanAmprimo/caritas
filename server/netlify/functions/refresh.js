// server/netlify/functions/refresh.js
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import { connectDB } from "./_db.js";

export async function handler(event, context) {
  try {
    const { refreshToken } = JSON.parse(event.body || "{}");
    if (!refreshToken) {
      return { statusCode: 401, body: JSON.stringify({ error: "Refresh token requerido" }) };
    }

    if (!process.env.JWT_REFRESH_SECRET) {
      const err = new Error("JWT_REFRESH_SECRET no esta configurada en Netlify");
      err.statusCode = 500;
      throw err;
    }

    if (!process.env.JWT_SECRET) {
      const err = new Error("JWT_SECRET no esta configurada en Netlify");
      err.statusCode = 500;
      throw err;
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    await connectDB();
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return { statusCode: 403, body: JSON.stringify({ error: "Refresh token invalido" }) };
    }

    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });

    return { statusCode: 200, body: JSON.stringify({ message: "Access token renovado", accessToken: newAccessToken }) };
  } catch (err) {
    return { statusCode: err.statusCode || 403, body: JSON.stringify({ error: err.message || "Refresh token invalido o expirado" }) };
  }
}
