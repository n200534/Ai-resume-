const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { analyzeResume } = require("../services/geminiService");
const { generateResumeReport } = require("../services/pdfgenerator");
const Resume = require("../models/ResumeModel");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Upload & Analyze Resume
router.post("/upload", authMiddleware, upload.single("resume"), async (req, res) => {
  const data = await pdfParse(req.file.path);
  const analysis = await analyzeResume(data.text);

  const newResume = new Resume({
    userId: req.user.userId,
    name: req.body.name,
    email: req.body.email,
    skills: analysis.skills,
    experience: analysis.experience,
    aiFeedback: analysis.feedback,
    extractedText: data.text
  });
  await newResume.save();

  res.json({ message: "Resume uploaded and analyzed", resume: newResume });
});

// Generate Resume Review Report
router.get("/resume-report/:resumeId", authMiddleware, async (req, res) => {
  const resume = await Resume.findById(req.params.resumeId);
  if (!resume) return res.status(404).json({ error: "Resume not found" });

  const filePath = await generateResumeReport(resume);
  res.download(filePath);
});

module.exports = router;
