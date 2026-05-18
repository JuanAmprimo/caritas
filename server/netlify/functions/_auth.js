import jwt from "jsonwebtoken";

function authError(message = "Token inválido o expirado") {
  const err = new Error(message);
  err.statusCode = 401;
  return err;
}

export function requireAuth(event) {
  const headers = event.headers || {};
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw authError("Token requerido");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw authError("Token requerido");
  }

  if (!process.env.JWT_SECRET) {
    const err = new Error("JWT_SECRET no esta configurada en Netlify");
    err.statusCode = 500;
    throw err;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch {
    throw authError();
  }
}
