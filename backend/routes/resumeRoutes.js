const express = require("express");
const multer = require("multer");
const { authMiddleware, roleMiddleware } = require("../middlewares/authMiddleware");
const Resume = require("../models/ResumeModel");

const router = express.Router();

// Set up Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload Resume (Only for Candidates)
router.post("/upload", authMiddleware, roleMiddleware("candidate"), upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Extract Resume Data (Later we'll process it with AI)
    const newResume = new Resume({
      userId: req.user.userId,
      name: req.body.name,
      email: req.body.email,
      extractedText: "Dummy extracted text (AI processing later)", // Placeholder for AI processing
    });

    await newResume.save();
    res.json({ message: "Resume uploaded successfully", resume: newResume });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
