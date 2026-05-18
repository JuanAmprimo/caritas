import mongoose from "mongoose";

let conn = null;
export async function connectDB() {
  if (!conn) {
    conn = await mongoose.connect(process.env.MONGO_URI);
  }
  return conn;
}
