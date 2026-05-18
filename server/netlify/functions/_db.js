import mongoose from "mongoose";

let conn = null;
export async function connectDB() {
  if (!process.env.MONGO_URI) {
    const err = new Error("MONGO_URI no esta configurada en Netlify");
    err.statusCode = 500;
    throw err;
  }

  if (!conn) {
    conn = await mongoose.connect(process.env.MONGO_URI);
  }
  return conn;
}
