import express from "express";
import mongoose from "mongoose";
import User from "../models/User.mjs";

const router = express.Router();

// Middleware (проверка токена перед вызовом)
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  import("jsonwebtoken").then(({ default: jwt }) => {
    jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, decoded) => {
      if (err) return res.status(403).json({ message: "Invalid token" });
      req.user = decoded;
      next();
    });
  });
}

// Получить избранные
router.get("/favorites", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("favorites");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.favorites || []);
  } catch (err) {
    console.error("Error loading favorites:", err);
    res.status(500).json({ message: "Error loading favorites" });
  }
});

// Добавить/удалить из избранного
router.post("/favorites/:productId", verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const index = user.favorites.findIndex((id) => id.toString() === productId);
    if (index >= 0) user.favorites.splice(index, 1);
    else user.favorites.push(productId);

    await user.save();
    const updated = await user.populate("favorites");
    res.json(updated.favorites);
  } catch (err) {
    console.error("Error updating favorites:", err);
    res.status(500).json({ message: "Error updating favorites" });
  }
});

export default router;
