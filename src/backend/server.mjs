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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

// ====== Database connection ======
let smartAssistantReply; // буде ініціалізовано після підключення до MongoDB

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");

    // Динамічний імпорт після підключення до бази
    const module = await import("./smartAssistant.mjs");
    smartAssistantReply = module.smartAssistantReply;
    console.log("🧠 Smart Assistant ready!");
  })
  .catch((err) => console.error("❌ MongoDB error:", err));

// ====== Schemas ======
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

// ====== Middleware ======
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
}

function verifyAdmin(req, res, next) {
  if (!req.user?.isAdmin)
    return res.status(403).json({ message: "Admin access required" });
  next();
}

// ====== Auth ======
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const isAdmin = email === "admin@megamart.com";
    const user = new User({ email, password: hashed, isAdmin, favorites: [] });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ====== Products ======
app.get("/api/products", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find().skip(skip).limit(limit),
      Product.countDocuments(),
    ]);

    res.json({
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error loading products:", err);
    res.status(500).json({ message: "Error loading products" });
  }
});

app.get("/api/products/filter", async (req, res) => {
  try {
    let { category, brand, page = 1, limit = 20 } = req.query;
    const query = {};
    if (category && category !== "undefined")
      query.category = { $regex: category, $options: "i" };
    if (brand && brand !== "undefined")
      query.brand = { $regex: brand, $options: "i" };

    const skip = (page - 1) * limit;
    const products = await Product.find(query).skip(skip).limit(Number(limit));
    const total = await Product.countDocuments(query);

    res.json({
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch {
    res.status(500).json({ message: "Error filtering products" });
  }
});

app.get("/api/products/random", async (req, res) => {
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

// ====== Favorites ======
app.get("/api/user/favorites", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("favorites");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.favorites || []);
  } catch {
    res.status(500).json({ message: "Error loading favorites" });
  }
});

app.post("/api/user/favorites/:productId", verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const index = user.favorites.findIndex((id) => id.toString() === productId);
    if (index >= 0) user.favorites.splice(index, 1);
    else user.favorites.push(productId);

    await user.save();
    const updated = await user.populate("favorites");
    res.json(updated.favorites);
  } catch {
    res.status(500).json({ message: "Error updating favorites" });
  }
});

// ====== Orders ======
app.post("/api/checkout", verifyToken, async (req, res) => {
  try {
    const { user, products, total } = req.body;
    const order = new Order({
      user: req.user.id,
      items: products.map((p) => ({
        productId: p.id,
        name: p.name,
        price: p.price,
        quantity: p.quantity,
      })),
      total,
      address: user,
    });
    await order.save();
    res.status(201).json({ message: "Order created successfully", order });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ message: "Error creating order" });
  }
});

app.get("/api/user/orders", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate("items.productId");
    res.json(orders);
  } catch (err) {
    console.error("Error loading orders:", err);
    res.status(500).json({ message: "Error loading orders" });
  }
});

// ====== WebSocket + Smart Assistant ======
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("💬 Chat connected");

  ws.on("message", async (message) => {
    const text = message.toString().trim();
    console.log("📩 User:", text);

    try {
      if (!smartAssistantReply) {
        ws.send(JSON.stringify({ from: "bot", text: "🤖 Асистент ще завантажується..." }));
        return;
      }

      // 1️⃣ Спроба відповісти з локальної бази
      const localReply = await smartAssistantReply(text);
      if (localReply) {
        ws.send(JSON.stringify({ from: "bot", text: localReply }));
        return;
      }

      // 2️⃣ Якщо не знайдено — звертаємось до OpenRouter
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct",
          messages: [
            {
              role: "system",
              content:
                "Ти — привітний консультант MegaMart. Відповідай українською, коротко й корисно. Допомагай обрати товар або оформити замовлення.",
            },
            { role: "user", content: text },
          ],
        }),
      });

      const data = await response.json();
      const reply =
        data?.choices?.[0]?.message?.content ||
        "🤖 Вибач, я не зовсім зрозумів питання.";

      ws.send(JSON.stringify({ from: "bot", text: reply }));
    } catch (err) {
      console.error("AI error:", err);
      ws.send(JSON.stringify({ from: "bot", text: "⚠️ Помилка зв’язку з асистентом." }));
    }
  });

  ws.on("close", () => console.log("❌ Chat disconnected"));
});

// ====== Serve frontend ======
const distPath = path.join(__dirname, "../../dist");
app.use(express.static(distPath));
app.use((req, res) => res.sendFile(path.join(distPath, "index.html")));

// ====== Start server ======
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 MegaMart + AI running on port ${PORT}`));
