import mongoose from "mongoose";

const VersionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fields: [mongoose.Schema.Types.Mixed],
  items: [mongoose.Schema.Types.Mixed],
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const ListSchema = new mongoose.Schema({
  title: { type: String, required: true },
  userId: { type: String, required: true },
  draftKey: { type: String, default: null },
  fields: [mongoose.Schema.Types.Mixed],
  items: [mongoose.Schema.Types.Mixed],
  versions: [VersionSchema],
  currentVersion: { type: Number, default: 0 },
});

export default mongoose.model("List", ListSchema);