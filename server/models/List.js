import mongoose from "mongoose";

const ListVersionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fields: [mongoose.Schema.Types.Mixed],
  items: [mongoose.Schema.Types.Mixed],
  savedAt: { type: Date, default: Date.now },
  reason: { type: String, default: "manual" },
});

const ListSchema = new mongoose.Schema({
  title: { type: String, required: true },
  userId: { type: String, required: true },
  draftKey: { type: String, default: null },
  fields: [mongoose.Schema.Types.Mixed],
  items: [mongoose.Schema.Types.Mixed],
  currentFields: [mongoose.Schema.Types.Mixed],
  currentItems: [mongoose.Schema.Types.Mixed],
  versionHistory: [ListVersionSchema],
  isAutosaved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("List", ListSchema);
