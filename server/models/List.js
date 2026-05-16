import mongoose from "mongoose";

const ListSchema = new mongoose.Schema({
  title: String,
  createdAt: { type: Date, default: Date.now },
  userId: String, // cada lista pertenece a un usuario
  donations: [{
    donationId: String,
    name: String,
    quantity: Number,
    extraFields: Object
  }]
});

export default mongoose.model("List", ListSchema);
