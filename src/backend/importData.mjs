import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.mjs";
import products from "./data/products.mjs";

dotenv.config({ path: "./.env" });

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    await Product.deleteMany();
    console.log("🗑️ Existing data removed");

    await Product.insertMany(products);
    console.log("✅ Products imported successfully!");

    process.exit();
  } catch (err) {
    console.error("❌ Error importing data:", err);
    process.exit(1);
  }
};

importData();
