// server/netlify/functions/refresh.js
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import { connectDB } from "./_db.js";

function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1] || null;
}

export async function handler(event, context) {
  try {
    const cookieHeader = event.headers?.cookie || event.headers?.Cookie || "";
    const refreshToken = parseCookie(cookieHeader, "refreshToken");
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

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, { algorithms: ["HS256"] });
    await connectDB();
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return { statusCode: 403, body: JSON.stringify({ error: "Refresh token invalido" }) };
    }

    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const newRefreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });

    user.refreshToken = newRefreshToken;
    await user.save();

    const cookieOptions = [
      `refreshToken=${newRefreshToken}`,
      "HttpOnly",
      "Path=/",
      "Max-Age=2592000",
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
      body: JSON.stringify({ message: "Access token renovado", accessToken: newAccessToken }),
    };
  } catch (err) {
    return { statusCode: err.statusCode || 403, body: JSON.stringify({ error: err.message || "Refresh token invalido o expirado" }) };
  }
}
