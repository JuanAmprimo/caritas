import mongoose from "mongoose";

const ListSchema = new mongoose.Schema({
  title: { type: String, required: true },
  userId: { type: String, required: true },
  draftKey: { type: String, default: null },
  fields: [mongoose.Schema.Types.Mixed],
  items: [mongoose.Schema.Types.Mixed],
  isAutosaved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("List", ListSchema);