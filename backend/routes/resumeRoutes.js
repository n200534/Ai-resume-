const express = require("express");
const multer = require("multer");
const fs = require("fs").promises;
const pdfParse = require("pdf-parse");
const { analyzeResumeWithGemini, extractSkillsFromResume } = require("../services/geminiService");
const Resume = require("../models/ResumeModel");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `resume-${Date.now()}-${file.originalname}`);
  }
});

// Improved file upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Enhanced resume analysis function
const analyzeResume = async (text) => {
  try {
    // Parallel processing of analysis and skill extraction
    const [analysis, skills] = await Promise.all([
      analyzeResumeWithGemini(text),
      extractSkillsFromResume(text)
    ]);

    return {
      skills: skills || analysis.skills || [],
      experience: analysis.experience || "No experience details extracted",
      aiFeedback: analysis.feedback || "No specific feedback available"
    };
  } catch (error) {
    console.error("Comprehensive resume analysis error:", error);
    return {
      skills: [],
      experience: "Analysis encountered difficulties",
      aiFeedback: "Unable to thoroughly process resume. Consider reviewing and resubmitting."
    };
  }
};

// Upload & Analyze Resume route
router.post(
  "/upload",
  authMiddleware,
  upload.single("resume"),
  async (req, res) => {
    try {
      // Validate file upload
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded or invalid file type" });
      }

      // Read PDF file with error handling
      let dataBuffer;
      try {
        dataBuffer = await fs.readFile(req.file.path);
      } catch (readError) {
        console.error("File read error:", readError);
        return res.status(500).json({ error: "Could not read uploaded file" });
      }

      // Parse PDF with timeout and error handling
      let data;
      try {
        data = await pdfParse(dataBuffer);
        
        // Validate extracted text
        if (!data.text || data.text.trim() === '') {
          return res.status(400).json({ error: "No text could be extracted from the PDF" });
        }
      } catch (parseError) {
        console.error("PDF parsing error:", parseError);
        return res.status(500).json({ error: "Failed to parse PDF content" });
      }

      // Analyze resume
      const analysis = await analyzeResume(data.text);

      // Create new resume entry
      const newResume = new Resume({
        userId: req.user._id,
        name: req.body.name || req.user.name,
        email: req.body.email || req.user.email,
        skills: analysis.skills,
        experience: analysis.experience,
        aiFeedback: analysis.aiFeedback,
        extractedText: data.text,
      });

      await newResume.save();

      // Safely remove the uploaded file
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.warn("Could not delete temporary file:", unlinkError);
      }

      res.json({
        message: "Resume uploaded and analyzed successfully",
        resume: {
          skills: newResume.skills,
          experience: newResume.experience,
          aiFeedback: newResume.aiFeedback
        }
      });

    } catch (error) {
      console.error("Comprehensive upload error:", error);
      res.status(500).json({ 
        error: "Failed to upload and analyze resume",
        details: error.message 
      });
    }
  }
);

// Get user's resume history
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('skills experience aiFeedback createdAt');
    
    res.json(resumes);
  } catch (error) {
    console.error("Resume history error:", error);
    res.status(500).json({ error: "Failed to retrieve resume history" });
  }
});

module.exports = router;