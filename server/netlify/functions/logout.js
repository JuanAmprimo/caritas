// server/netlify/functions/logout.js
import User from "../../models/User.js";
import { connectDB } from "./_db.js";
import { requireAuth } from "./_auth.js";

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
    const userId = requireAuth(event);
    await connectDB();

    const cookieHeader = event.headers?.cookie || event.headers?.Cookie || "";
    const refreshToken = parseCookie(cookieHeader, "refreshToken");
    const user = await User.findById(userId);
    if (user && refreshToken) {
      const activeRefreshTokens = Array.isArray(user.refreshTokens) ? user.refreshTokens : [];
      user.refreshTokens = activeRefreshTokens.filter((token) => token !== refreshToken);

      if (user.refreshToken === refreshToken) {
        user.refreshToken = null;
      }

      await user.save();
    }

    const cookieOptions = [
      "refreshToken=deleted",
      "HttpOnly",
      "Path=/",
      "Max-Age=0",
      "SameSite=Lax",
    ];
    if (process.env.NODE_ENV === "production") {
      cookieOptions.push("Secure");
    }

    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": cookieOptions.join("; "),
      },
      body: JSON.stringify({ message: "Cierre de sesión exitoso" }),
    };
  } catch (err) {
    return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message || "No se pudo cerrar sesión" }) };
  }
}
