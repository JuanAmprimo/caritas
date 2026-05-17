import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import List from "../models/List.js"; 
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Registro
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.json({ message: "Usuario registrado con éxito ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login con cookies
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Contraseña incorrecta" });

  // Access token (corto)
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });

  // Refresh token (largo)
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

  // Guardar refresh token en DB
  user.refreshToken = refreshToken;
  await user.save();

  // 🔹 Guardar tokens en cookies seguras
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 15 * 60 * 1000 // 15 minutos
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
  });

  res.json({ message: "Login exitoso" });
});

// Refresh token con cookies
router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: "Refresh token requerido" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: "Refresh token inválido" });
    }

    const newAccessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000
    });

    res.json({ message: "Access token renovado" });
  } catch {
    res.status(403).json({ error: "Refresh token inválido o expirado" });
  }
});

// Eliminar cuenta (requiere login)
router.delete("/delete", authMiddleware, async (req, res) => {
  try {
    await List.deleteMany({ userId: req.user.id }); 
    await User.findByIdAndDelete(req.user.id);      

    res.json({ message: "Cuenta eliminada permanentemente ✅" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar la cuenta" });
  }
});

export default router;
