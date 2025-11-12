import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import http from "http";
import { WebSocketServer } from "ws";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====== LOAD .env ======
dotenv.config({ path: path.join(__dirname, ".env") });

// Fix for Render — ALWAYS use MONGO_URI
const MONGO = process.env.MONGO_URI;

if (!MONGO) {
  console.error("❌ ERROR: Missing MONGO_URI in environment variables!");
}

const app = express();
app.use(cors({
  origin: "*",
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type, Authorization",
}));
app.use(express.json({ limit: "20mb" }));

// ====== DATABASE CONNECTION ======
let smartAssistantReply;

mongoose
  .connect(MONGO)
  .then(async () => {
    console.log("✅ MongoDB connected");

    const module = await import("./smartAssistant.mjs");
    smartAssistantReply = module.smartAssistantReply;

    console.log("🧠 Smart Assistant ready");
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ====== SCHEMAS ======
const productSchema = new mongoose.Schema({
  name: String,
  brand: String,
  category: String,
  price: Number,
  off: Number,
  img: String,
  description: String,
});
const Product = mongoose.model("Product", productSchema);

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
});
const User = mongoose.model("User", userSchema);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    total: Number,
    address: {
      name: String,
      phone: String,
      email: String,
      country: String,
      city: String,
      address: String,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);
const Order = mongoose.model("Order", orderSchema);

// ====== TOKEN MIDDLEWARE ======
function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });

  const token = header.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
}

function verifyAdmin(req, res, next) {
  if (!req.user?.isAdmin)
    return res.status(403).json({ message: "Admin access only" });
  next();
}

// ====== AUTH ======
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
      process.env.JWT_SECRET || "secretkey",
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
      { id: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    res.json({ token, email, isAdmin: user.isAdmin });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ====== PRODUCTS ======
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    console.error("Error loading products:", err);
    res.status(500).json({ message: "Error loading products" });
  }
});

// ====== AI CHAT / WEBSOCKET ======
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("💬 Chat connected");

  ws.on("message", async (msg) => {
    const text = msg.toString().trim();

    try {
      if (!smartAssistantReply) {
        ws.send(JSON.stringify({ text: "🤖 Асистент завантажується..." }));
        return;
      }

      const localReply = await smartAssistantReply(text);
      if (localReply) {
        ws.send(JSON.stringify({ text: localReply }));
        return;
      }

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "mistralai/mistral-7b-instruct",
            messages: [
              { role: "user", content: text }
            ],
          }),
        }
      );

      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content;

      ws.send(JSON.stringify({ text: reply || "Помилка AI" }));
    } catch (err) {
      ws.send(JSON.stringify({ text: "⚠️ Помилка сервера AI" }));
    }
  });
});

// ====== START ======
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

