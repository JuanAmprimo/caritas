import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import listRoutes from "./routes/lists.js";
import donationRoutes from "./routes/donations.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.error("❌ Error de conexión:", err));

// Rutas
app.use("/api/lists", listRoutes);
app.use("/api/donations", donationRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

app.listen(3001, () => console.log("Servidor en http://localhost:3001"));
