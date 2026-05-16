import mongoose from "mongoose";

const ListSchema = new mongoose.Schema({
  title: String,
  createdAt: { type: Date, default: Date.now },
  products: [{
    productId: String,
    name: String,
    quantity: Number,
    extraFields: Object
  }]
});

export default mongoose.model("List", ListSchema);
