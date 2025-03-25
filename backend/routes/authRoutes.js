const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/UserModel");
const dotenv = require("dotenv");
const router = express.Router();

// Signup Route
router.post(
  "/signup",
  [
    // Enhanced validation
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters long"),

    body("email")
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),

    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/
      )
      .withMessage(
        "Password must include uppercase, lowercase, number, and special character"
      ),

    body("role")
      .isIn(["candidate", "recruiter"])
      .withMessage("Role must be either 'candidate' or 'recruiter'"),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
        })),
      });
    }

    try {
      const { name, email, password, role } = req.body;

      // Detailed logging
      console.log("Signup Request:", { name, email, role });

      // Check if user already exists
      let existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          error: "User with this email already exists",
          field: "email",
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        role,
      });

      await newUser.save();

      // Generate token
      const token = jwt.sign(
        {
          userId: newUser._id,
          role: newUser.role,
        },
        process.env.JWT_SECRET, // Corrected secret key usage
        { expiresIn: "7d" }
      );

      // Successful response
      res.status(201).json({
        message: "Signup successful",
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error("Signup Error:", error);
      res.status(500).json({
        error: "Server error during signup",
        details: error.message,
      });
    }
  }
);

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if email, password, and role are provided
    if (!email || !password || !role) {
      return res.status(400).json({
        error: "Email, password, and role are required",
      });
    }

    // Find user by email and role
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(404).json({
        error: "User not found or incorrect role",
        field: "email",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid credentials",
        field: "password",
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET, // Corrected secret key usage
      { expiresIn: "7d" }
    );

    // Successful login response
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      error: "Server error during login",
      details: error.message,
    });
  }
});

module.exports = router;
