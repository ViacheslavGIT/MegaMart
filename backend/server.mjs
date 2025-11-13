import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import http from "http";
import { WebSocketServer } from "ws";
import fetch from "node-fetch";

// Загружаем переменные окружения
dotenv.config();

// ================== ENV =====================
const MONGO = process.env.MONGO_URL;
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";
const OPENROUTER_KEY = process.env.OPENROUTER_KEY || "";

if (!MONGO) {
  console.error("❌ ERROR: MONGO_URL IS MISSING!");
  process.exit(1);
}

// ================== SCHEMAS =====================
const productSchema = new mongoose.Schema({
  name: String,
  brand: String,
  category: String,
  price: Number,
  off: Number,
  img: String,
  description: String,
});

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  isAdmin: { type: Boolean, default: false },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    total: Number,
    address: Object,
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

const Product = mongoose.model("Product", productSchema);
const User = mongoose.model("User", userSchema);
const Order = mongoose.model("Order", orderSchema);

// ================== APP INIT =====================
const app = express();
app.use(
  cors({
    origin: "*",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type, Authorization",
  })
);

app.use(express.json({ limit: "20mb" }));

// ================== DB CONNECT =====================
mongoose
  .connect(MONGO)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ================== AUTH MIDDLEWARE =====================
function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });

  const token = header.split(" ")[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
}

// ================== AUTH ROUTES =====================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User exists" });

    const hashed = await bcrypt.hash(password, 10);
    const isAdmin = email === "admin@megamart.com";

    const user = new User({ email, password: hashed, isAdmin });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, isAdmin },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ token, email, isAdmin });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, email, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, email, isAdmin: user.isAdmin });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ================== PRODUCTS =====================

// Все товары
app.get("/api/products", async (req, res) => {
  try {
    const items = await Product.find({});
    res.json(items);
  } catch {
    res.status(500).json({ message: "Error loading products" });
  }
});

// Фильтрация + пагинация
app.get("/api/products/filter", async (req, res) => {
  try {
    let { category, brand, page = 1, limit = 20 } = req.query;

    const query = {};
    if (category && category !== "undefined")
      query.category = { $regex: category, $options: "i" };

    if (brand && brand !== "undefined")
      query.brand = { $regex: brand, $options: "i" };

    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Product.find(query).skip(skip).limit(limit),
      Product.countDocuments(query),
    ]);

    res.json({
      products: items,
      page,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Error filtering products" });
  }
});

// ================== AI CHAT =====================
let smartAssistantReply = null;

import("./smartAssistant.mjs").then((m) => {
  smartAssistantReply = m.smartAssistantReply;
  console.log("🧠 Smart Assistant ready");
});

// ================== WebSocket =====================
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("💬 Chat connected");

  ws.on("message", async (msg) => {
    const text = msg.toString();

    try {
      if (!smartAssistantReply) {
        return ws.send(
          JSON.stringify({ text: "🤖 Асистент завантажується..." })
        );
      }

      const localReply = await smartAssistantReply(text);
      if (localReply) return ws.send(JSON.stringify({ text: localReply }));
    } catch {}

    ws.send(JSON.stringify({ text: "⚠️ AI недоступний у демо-режимі" }));
  });
});

// ================== START =====================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
