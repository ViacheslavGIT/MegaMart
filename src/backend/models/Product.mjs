import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: String,
  category: String,
  price: Number,
  off: Number,
  img: String,
  description: String,
});

// ✅ якщо модель уже зареєстрована — використовуємо існуючу
export default mongoose.models.Product || mongoose.model("Product", productSchema);
