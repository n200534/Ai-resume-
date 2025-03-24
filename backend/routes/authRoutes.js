const express = require("express");
const bcrypt = require("bcryptjs");

const { body, validationResult } = require("express-validator");
const User = require("../models/UserModel");

const router = express.Router();

// Signup Route
router.post(
  "/signup",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["candidate", "recruiter"])
      .withMessage("Role must be 'candidate' or 'recruiter'"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const { name, email, password, role } = req.body;

      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ error: "User already exists" });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      user = new User({ name, email, password: hashedPassword, role });
      await user.save();

      // Generate token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ message: "Signup successful", token });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ✅ FIXED: Use `router.post` instead of `app.post`
router.post("/login", async (req, res) => {
  try {
    console.log("🛠️ Incoming Login Request:", req.body);

    if (!req.body) {
      console.error("❌ Error: Missing request body");
      return res.status(400).json({ error: "Missing request body" });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      console.error("❌ Error: Email or password missing");
      return res.status(400).json({ error: "Email and password are required" });
    }

    console.log("🔍 Searching for user:", email);
    const user = await User.findOne({ email });

    if (!user) {
      console.error("❌ Error: User not found");
      return res.status(404).json({ error: "User not found" });
    }

    console.log("🔑 Verifying password...");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error("❌ Error: Invalid password");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("✅ Login successful");
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, role: user.role });
  } catch (error) {
    console.error("❌ Login Error:", error.message, error.stack); // More detailed logging
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

module.exports = router;
