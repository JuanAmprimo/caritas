// server/netlify/functions/delete.js
import mongoose from "mongoose";
import User from "../../models/User.js";
import List from "../../models/List.js";

let conn = null;
async function connectDB() {
  if (!conn) {
    conn = await mongoose.connect(process.env.MONGO_URI);
  }
  return conn;
}

export async function handler(event, context) {
  try {
    await connectDB();
    const { userId } = JSON.parse(event.body);

    await List.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    return { statusCode: 200, body: JSON.stringify({ message: "Cuenta eliminada permanentemente ✅" }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Error al eliminar la cuenta" }) };
  }
}
