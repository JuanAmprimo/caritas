// server/netlify/functions/register.js
import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import { connectDB } from "./_db.js";

export async function handler(event, context) {
  try {
    await connectDB();
    const { username, email, password } = JSON.parse(event.body);

    if (!username || !email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: "Todos los campos son obligatorios" }) };
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { statusCode: 400, body: JSON.stringify({ error: "El email ya está registrado" }) };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    return { statusCode: 201, body: JSON.stringify({ message: "Usuario registrado con éxito ✅" }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
