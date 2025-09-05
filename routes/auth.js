const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "secretkey";

// Register
router.post("/register", async (req, res) => {
  try {
    const { rollNo, name, password } = req.body;
    console.log("Register request:", req.body);

    const existing = await User.findOne({ rollNo });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ rollNo, name, passwordHash: hash });

    await user.save();
    console.log("User saved:", user);

    res.json({ message: "Registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Error registering user", error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { rollNo, password } = req.body;
    const user = await User.findOne({ rollNo });
    if (!user) return res.status(400).json({ message: "Invalid roll number" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "1d" });
    res.json({
      message: "Login successful",
      token,
      rollNo: user.rollNo,
      name: user.name
    });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
});

module.exports = router;
