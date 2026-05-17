import express from "express";
import List from "../../models/List.js";
import authMiddleware from "../../middleware/auth.js";

const router = express.Router();

// Crear lista (requiere login)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, fields, items } = req.body;
    const newList = new List({ title, userId: req.user.id, fields, items });
    await newList.save();
    res.json(newList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener listas del usuario logueado
router.get("/", authMiddleware, async (req, res) => {
  try {
    const lists = await List.find({ userId: req.user.id });
    res.json(lists);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener lista por id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.params.id, userId: req.user.id });
    res.json(list);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar lista
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updated = await List.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar lista
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await List.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: "Lista eliminada" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
