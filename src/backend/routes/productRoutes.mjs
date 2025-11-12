import express from "express";
import Product from "../models/Product.mjs";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find().skip(skip).limit(limit),
      Product.countDocuments(),
    ]);

    res.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Error loading products" });
  }
});

router.get("/filter", async (req, res) => {
  try {
    let { category, brand, page = 1, limit = 20 } = req.query;
    const query = {};
    if (category && category !== "undefined") query.category = { $regex: category, $options: "i" };
    if (brand && brand !== "undefined") query.brand = { $regex: brand, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);
    const products = await Product.find(query).skip(skip).limit(Number(limit));
    const total = await Product.countDocuments(query);

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Error filtering products" });
  }
});

router.get("/random", async (req, res) => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) return res.json(null);
    const random = Math.floor(Math.random() * count);
    const product = await Product.findOne().skip(random);
    res.json(product);
  } catch {
    res.status(500).json({ message: "Error fetching random product" });
  }
});

export default router;
