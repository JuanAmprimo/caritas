import express from "express";
import List from "../models/List.js";

const router = express.Router();

// Crear lista
router.post("/", async (req, res) => {
  try {
    console.log("Datos recibidos:", req.body); // 👀 verificar que llega title
    const { title, userId, fields, items } = req.body;
    const newList = new List({ title, userId, fields, items });
    await newList.save();
    console.log("Lista guardada:", newList); // 👀 confirmar que se guardó con title
    res.json(newList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Obtener listas por usuario
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    const lists = await List.find({ userId });
    res.json(lists);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar lista
router.put("/:id", async (req, res) => {
  try {
    const updated = await List.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar lista
router.delete("/:id", async (req, res) => {
  try {
    await List.findByIdAndDelete(req.params.id);
    res.json({ message: "Lista eliminada" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
