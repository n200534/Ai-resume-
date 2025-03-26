const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const {
  analyzeResumeWithGemini,
  extractSkillsFromResume,
  calculateATSScore,
} = require("../services/geminiService");

router.post("/upload", async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.files || !req.files.resume) {
      return res.status(400).json({ error: "No resume file uploaded" });
    }

    const resumeFile = req.files.resume;
    const jobDescription = req.body.jobDescription || "";
    const uploadPath = path.join(__dirname, "../uploads", resumeFile.name);

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save the file
    await resumeFile.mv(uploadPath);

    // Read PDF
    const dataBuffer = fs.readFileSync(uploadPath);
    const pdfData = await pdf(dataBuffer);

    // Optional: Delete the uploaded file after processing
    fs.unlinkSync(uploadPath);

    // Perform Gemini analysis
    const [resumeAnalysis, extractedSkills, atsScore] = await Promise.all([
      analyzeResumeWithGemini(pdfData.text),
      extractSkillsFromResume(pdfData.text),
      jobDescription
        ? calculateATSScore(pdfData.text, jobDescription)
        : Promise.resolve(null),
    ]);

    // Prepare response
    const response = {
      message: "Resume uploaded and processed successfully",
      rawText: pdfData.text,
      textLength: pdfData.text.length,
      analysis: {
        skills: extractedSkills,
        experience: resumeAnalysis.experience,
        feedback: resumeAnalysis.feedback,
      },
    };

    // Add ATS score if available
    if (atsScore) {
      response.atsAnalysis = atsScore;
    }

    res.json(response);
  } catch (error) {
    console.error("Resume upload error:", error);
    res.status(500).json({
      error: "Failed to process resume",
      details: error.message,
    });
  }
});

// New route specifically for ATS scoring
router.post("/ats-score", async (req, res) => {
  try {
    // Check if resume file and job description are provided
    if (!req.files || !req.files.resume) {
      return res.status(400).json({ error: "No resume file uploaded" });
    }

    if (!req.body.jobDescription) {
      return res.status(400).json({ error: "Job description is required" });
    }

    const resumeFile = req.files.resume;
    const jobDescription = req.body.jobDescription;
    const uploadPath = path.join(__dirname, "../uploads", resumeFile.name);

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save the file
    await resumeFile.mv(uploadPath);

    // Read PDF
    const dataBuffer = fs.readFileSync(uploadPath);
    const pdfData = await pdf(dataBuffer);

    // Optional: Delete the uploaded file after processing
    fs.unlinkSync(uploadPath);

    // Calculate ATS Score
    const atsScore = await calculateATSScore(pdfData.text, jobDescription);

    res.json({
      message: "ATS Score calculated successfully",
      atsAnalysis: atsScore,
      rawText: pdfData.text,
      textLength: pdfData.text.length,
    });
  } catch (error) {
    console.error("ATS Score calculation error:", error);
    res.status(500).json({
      error: "Failed to calculate ATS Score",
      details: error.message,
    });
  }
});

module.exports = router;
