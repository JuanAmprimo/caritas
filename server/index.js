import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import listRoutes from "./routes/Lists.js";
import donationRoutes from "./routes/Donations.js";
import itemRoutes from "./routes/Items.js";
import authRoutes from "./routes/auth.js";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();

const allowedOrigins = [
  "http://localhost:5173",              // desarrollo local
  "https://caritas-funes.netlify.app"  // producción en Netlify
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.error("❌ Error de conexión:", err));

// Rutas
app.use("/api/lists", listRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/auth", authRoutes);


// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));

