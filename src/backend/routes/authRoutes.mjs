import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.mjs";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const isAdmin = email === "admin@megamart.com";
    const user = new User({ email, password: hashed, isAdmin });
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
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
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

export default router;
