import express from "express";
import List from "../models/List.js";

const router = express.Router();

// Obtener todas las listas de un usuario
router.get("/", async (req, res) => {
  try {
    const lists = await List.find({ userId: req.query.userId });
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear nueva lista
router.post("/", async (req, res) => {
  try {
    const newList = new List(req.body);
    await newList.save();
    res.json(newList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar lista por ID
router.put("/:id", async (req, res) => {
  try {
    const updatedList = await List.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedList);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar lista por ID
router.delete("/:id", async (req, res) => {
  try {
    await List.findByIdAndDelete(req.params.id);
    res.json({ message: "Lista eliminada" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
