import express from "express";
import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  userId: String,
  extraFields: Object
});

const Item = mongoose.model("Item", ItemSchema);

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const newItem = new Item(req.body);
    await newItem.save();
    res.json(newItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
