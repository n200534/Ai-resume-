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

// Import MongoDB models
const {Resume,ATSAnalysis} = require("../models/ResumeModel");


router.post("/upload", async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.files || !req.files.resume) {
      return res.status(400).json({ error: "No resume file uploaded" });
    }
    
    const resumeFile = req.files.resume;
    const jobDescription = req.body.jobDescription || "";
    const userId = req.body.userId; // Assuming you're sending userId in the request
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
    
    // Prepare data for MongoDB
    const resumeData = {
      fileName: resumeFile.name,
      rawText: pdfData.text,
      skills: extractedSkills,
      experience: resumeAnalysis.experience,
      feedback: resumeAnalysis.feedback,
      userId: userId || null,
      uploadDate: new Date()
    };
    
    // Save to MongoDB
    const savedResume = await Resume.create(resumeData);
    
    // Save ATS analysis if available
    let atsAnalysisData = null;
    if (atsScore) {
      atsAnalysisData = await ATSAnalysis.create({
        resumeId: savedResume._id,
        jobDescription,
        score: atsScore.score,
        matchPercentage: atsScore.matchPercentage,
        feedback: atsScore.feedback,
        missingKeywords: atsScore.missingKeywords,
        foundKeywords: atsScore.matchedKeywords,
        userId: userId || null,
        analysisDate: new Date()
      });
    }
    
    // Prepare response
    const response = {
      message: "Resume uploaded, processed, and saved successfully",
      resumeId: savedResume._id,
      rawText: pdfData.text.substring(0, 200) + "...", // Truncated for response
      textLength: pdfData.text.length,
      analysis: {
        skills: extractedSkills,
        experience: resumeAnalysis.experience,
        feedback: resumeAnalysis.feedback,
      },
    };
    
    // Add ATS score if available
    if (atsScore && atsAnalysisData) {
      response.atsAnalysis = atsScore;
      response.atsAnalysisId = atsAnalysisData._id;
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

// ATS scoring route with MongoDB integration
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
    const userId = req.body.userId;
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
    
    // First save the resume data
    const resumeData = {
      fileName: resumeFile.name,
      rawText: pdfData.text,
      userId: userId || null,
      uploadDate: new Date()
    };
    
    const savedResume = await Resume.create(resumeData);
    
    // Then save the ATS analysis
    const atsAnalysisData = await ATSAnalysis.create({
      resumeId: savedResume._id,
      jobDescription,
      score: atsScore.score,
      matchPercentage: atsScore.matchPercentage,
      feedback: atsScore.feedback,
      missingKeywords: atsScore.missingKeywords,
      foundKeywords: atsScore.matchedKeywords,
      userId: userId || null,
      analysisDate: new Date()
    });
    
    res.json({
      message: "ATS Score calculated and saved successfully",
      resumeId: savedResume._id,
      atsAnalysisId: atsAnalysisData._id,
      atsAnalysis: atsScore,
      rawText: pdfData.text.substring(0, 200) + "...", // Truncated for response
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

// Get all resumes for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const resumes = await Resume.find({ userId }).sort({ uploadDate: -1 });
    
    res.json({
      message: "Resumes retrieved successfully",
      count: resumes.length,
      resumes: resumes.map(resume => ({
        id: resume._id,
        fileName: resume.fileName,
        uploadDate: resume.uploadDate,
        skills: resume.skills
      }))
    });
  } catch (error) {
    console.error("Error retrieving resumes:", error);
    res.status(500).json({
      error: "Failed to retrieve resumes",
      details: error.message
    });
  }
});

// Get a specific resume with its analysis
router.get("/:resumeId", async (req, res) => {
  try {
    const resumeId = req.params.resumeId;
    
    // Find resume and any associated ATS analyses
    const [resume, atsAnalyses] = await Promise.all([
      Resume.findById(resumeId),
      ATSAnalysis.find({ resumeId })
    ]);
    
    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }
    
    res.json({
      message: "Resume retrieved successfully",
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        uploadDate: resume.uploadDate,
        skills: resume.skills,
        experience: resume.experience,
        feedback: resume.feedback,
        rawText: resume.rawText
      },
      atsAnalyses: atsAnalyses.map(analysis => ({
        id: analysis._id,
        date: analysis.analysisDate,
        score: analysis.score,
        matchPercentage: analysis.matchPercentage,
        feedback: analysis.feedback,
        jobDescription: analysis.jobDescription.substring(0, 100) + "..."
      }))
    });
  } catch (error) {
    console.error("Error retrieving resume:", error);
    res.status(500).json({
      error: "Failed to retrieve resume",
      details: error.message
    });
  }
});

// Delete a resume and its associated analyses
router.delete("/:resumeId", async (req, res) => {
  try {
    const resumeId = req.params.resumeId;
    
    // Delete both resume and associated ATS analyses
    await Promise.all([
      Resume.findByIdAndDelete(resumeId),
      ATSAnalysis.deleteMany({ resumeId })
    ]);
    
    res.json({
      message: "Resume and associated analyses deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting resume:", error);
    res.status(500).json({
      error: "Failed to delete resume",
      details: error.message
    });
  }
});

module.exports = router;