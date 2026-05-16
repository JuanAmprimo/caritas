import express from "express";
import Donation from "../models/Donation.js";

const router = express.Router();

// Obtener todas las donaciones de un usuario
router.get("/", async (req, res) => {
  try {
    const donations = await Donation.find({ userId: req.query.userId });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear nueva donación
router.post("/", async (req, res) => {
  try {
    const newDonation = new Donation(req.body);
    await newDonation.save();
    res.json(newDonation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar donación por ID
router.put("/:id", async (req, res) => {
  try {
    const updatedDonation = await Donation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedDonation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar donación por ID
router.delete("/:id", async (req, res) => {
  try {
    await Donation.findByIdAndDelete(req.params.id);
    res.json({ message: "Donación eliminada" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
