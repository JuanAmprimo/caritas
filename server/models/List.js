import mongoose from "mongoose";

const ListSchema = new mongoose.Schema({
  title: { type: String, required: true },
  userId: { type: String, required: true },
  fields: [mongoose.Schema.Types.Mixed],
  items: [mongoose.Schema.Types.Mixed] // guarda objetos con tus claves (nombre, apellido, etc.)
});

export default mongoose.model("List", ListSchema);
