import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  // 🔹 Primero intentamos leer el token desde la cookie
  const token = req.cookies.accessToken;

  // 🔹 Si no hay cookie, opcionalmente podés aceptar el header Authorization (para compatibilidad)
  // const authHeader = req.headers["authorization"];
  // const token = req.cookies.accessToken || (authHeader && authHeader.split(" ")[1]);

  if (!token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id }; // 🔹 guardamos solo el id
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}
