import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  data: { type: Buffer, required: true },
  size: { type: Number, required: true },
  createdAt: { type: Date, default: () => new Date() },
});

export default mongoose.model("Document", DocumentSchema);
