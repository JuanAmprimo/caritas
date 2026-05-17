import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import List from "../models/List.js"; // si querés borrar también las listas
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

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar cuenta (requiere login)
router.delete("/delete", authMiddleware, async (req, res) => {
  try {
    await List.deleteMany({ userId: req.user.id }); // 🔹 borrar listas del usuario
    await User.findByIdAndDelete(req.user.id);      // 🔹 borrar usuario

    res.json({ message: "Cuenta eliminada permanentemente ✅" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar la cuenta" });
  }
});

export default router;
