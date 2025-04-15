const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const mongoose = require("mongoose");
const {
  analyzeResumeWithGemini,
  extractSkillsFromResume,
  calculateATSScore,
} = require("../services/geminiService");

// Import MongoDB models
const Resume = require("../models/ResumeModel");
const ATSAnalysis = require("../models/ATSAnalysisSchema");

// Auth middleware for protected routes
const { authMiddleware } = require("../middlewares/authMiddleware");

/**
 * @route POST /api/resumes/upload
 * @desc Upload and process a resume
 * @access Private
 */
// Improved version of the resume routes

/**
 * @route POST /api/resumes/upload
 * @desc Upload and process a resume
 * @access Private
 */
router.post("/upload", authMiddleware, async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.files || !req.files.resume) {
      return res.status(400).json({ error: "No resume file uploaded" });
    }

    const resumeFile = req.files.resume;
    const jobDescription = req.body.jobDescription || "";
    const userId = req.user.userId;

    // Validate file type
    if (!resumeFile.name.match(/\.(pdf)$/i)) {
      return res.status(400).json({ error: "Only PDF files are supported" });
    }

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
      userId: userId,
      uploadDate: new Date(),
    };

    // Check for existing resume and replace if it exists
    let savedResume;
    const existingResume = await Resume.findOne({ userId: userId }).sort({
      uploadDate: -1,
    });

    if (existingResume) {
      // Update existing resume
      savedResume = await Resume.findByIdAndUpdate(
        existingResume._id,
        resumeData,
        { new: true, runValidators: true }
      );
      console.log(`Updated existing resume for user ${userId}`);
    } else {
      // Create new resume
      savedResume = await Resume.create(resumeData);
      console.log(`Created new resume for user ${userId}`);
    }

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
        userId: userId,
        analysisDate: new Date(),
      });
    }

    // Prepare response
    const response = {
      message: existingResume
        ? "Resume updated successfully"
        : "Resume uploaded, processed, and saved successfully",
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
/**
 * @route POST /api/resumes/ats-score
 * @desc Calculate ATS score for a resume
 * @access Private
 */
// Modify the beginning of your /api/resumes/ats-score route to handle resumeId:

router.post("/ats-score", authMiddleware, async (req, res) => {
  try {
    // Check if we have resumeId or a file upload
    const { resumeId, jobDescription, jobId } = req.body;
    const userId = req.user.userId;

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Valid user ID is required" });
    }

    // Validate job description
    if (!jobDescription) {
      return res.status(400).json({ error: "Job description is required" });
    }

    let resumeText;
    let savedResume;

    // If resumeId is provided, fetch existing resume
    if (resumeId) {
      savedResume = await Resume.findById(resumeId);

      if (!savedResume) {
        return res.status(404).json({ error: "Resume not found" });
      }

      // Make sure the resume belongs to the user
      if (savedResume.userId.toString() !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to access this resume" });
      }

      resumeText = savedResume.rawText;
    }
    // If file is uploaded, process the file
    else if (req.files && req.files.resume) {
      const resumeFile = req.files.resume;
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
      resumeText = pdfData.text;

      // Optional: Delete the uploaded file after processing
      fs.unlinkSync(uploadPath);

      // First save the resume data
      const resumeData = {
        fileName: resumeFile.name,
        rawText: resumeText,
        userId: mongoose.Types.ObjectId(userId),
        uploadDate: new Date(),
      };

      // Check for existing resume to update
      const existingResume = await Resume.findOne({
        userId: mongoose.Types.ObjectId(userId),
      }).sort({ uploadDate: -1 });

      if (existingResume) {
        // Update existing resume
        savedResume = await Resume.findByIdAndUpdate(
          existingResume._id,
          resumeData,
          { new: true, runValidators: true }
        );
      } else {
        // Create new resume
        savedResume = await Resume.create(resumeData);
      }
    } else {
      return res
        .status(400)
        .json({ error: "No resume provided (neither resumeId nor file)" });
    }

    // Now we have resumeText either way, so calculate ATS Score
    const atsScore = await calculateATSScore(resumeText, jobDescription);

    // Then save the ATS analysis
    const atsAnalysisData = await ATSAnalysis.create({
      resumeId: savedResume._id,
      jobDescription,
      jobId: jobId || null,
      score: atsScore.atsScore || 0,
      matchPercentage: atsScore.keywordMatch?.matchPercentage || 0,
      strengths: atsScore.strengths || [],
      improvementAreas: atsScore.improvementAreas || [],
      recommendedChanges: atsScore.recommendedChanges || [],
      userId: new mongoose.Types.ObjectId(userId),
      analysisDate: new Date(),
    });

    res.json({
      message: "ATS Score calculated and saved successfully",
      resumeId: savedResume._id,
      atsAnalysisId: atsAnalysisData._id,
      atsAnalysis: atsScore,
    });
  } catch (error) {
    console.error("ATS Score calculation error:", error);
    res.status(500).json({
      error: "Failed to calculate ATS Score",
      details: error.message,
    });
  }
});

/**
 * @route GET /api/resumes/user/:userId
 * @desc Get all resumes for a user
 * @access Private
 */
router.get("/user/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Ensure requested userId matches authenticated user or user is admin
    if (req.user.userId !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Not authorized to access these resumes" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const resumes = await Resume.find({
      userId: mongoose.Types.ObjectId(userId),
    }).sort({ uploadDate: -1 });

    res.json({
      message: "Resumes retrieved successfully",
      count: resumes.length,
      resumes: resumes.map((resume) => ({
        id: resume._id,
        fileName: resume.fileName,
        uploadDate: resume.uploadDate,
        skills: resume.skills,
      })),
    });
  } catch (error) {
    console.error("Error retrieving resumes:", error);
    res.status(500).json({
      error: "Failed to retrieve resumes",
      details: error.message,
    });
  }
});

/**
 * @route GET /api/resumes/current
 * @desc Get current user's latest resume
 * @access Private
 */
router.get("/current", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const resume = await Resume.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    }).sort({ uploadDate: -1 });

    if (!resume) {
      return res.status(404).json({
        error: "Resume not found",
        message: "Please upload a resume first",
      });
    }

    res.json({
      message: "Current resume retrieved successfully",
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        uploadDate: resume.uploadDate,
        skills: resume.skills,
        experience: resume.experience,
        feedback: resume.feedback,
      },
    });
  } catch (error) {
    console.error("Error retrieving current resume:", error);
    res.status(500).json({
      error: "Failed to retrieve current resume",
      details: error.message,
    });
  }
});

/**
 * @route GET /api/resumes/:resumeId
 * @desc Get a specific resume with its analysis
 * @access Private
 */
router.get("/:resumeId", authMiddleware, async (req, res) => {
  try {
    const resumeId = req.params.resumeId;

    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      return res.status(400).json({ error: "Invalid resume ID format" });
    }

    // Find resume and any associated ATS analyses
    const [resume, atsAnalyses] = await Promise.all([
      Resume.findById(resumeId),
      ATSAnalysis.find({ resumeId }),
    ]);

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    // Check if user is authorized to access this resume
    if (
      resume.userId.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to access this resume" });
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
        rawText: resume.rawText,
      },
      atsAnalyses: atsAnalyses.map((analysis) => ({
        id: analysis._id,
        date: analysis.analysisDate,
        score: analysis.score,
        matchPercentage: analysis.matchPercentage,
        feedback: analysis.feedback,
        jobDescription: analysis.jobDescription.substring(0, 100) + "...",
      })),
    });
  } catch (error) {
    console.error("Error retrieving resume:", error);
    res.status(500).json({
      error: "Failed to retrieve resume",
      details: error.message,
    });
  }
});

/**
 * @route DELETE /api/resumes/:resumeId
 * @desc Delete a resume and its associated analyses
 * @access Private
 */
router.delete("/:resumeId", authMiddleware, async (req, res) => {
  try {
    const resumeId = req.params.resumeId;

    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      return res.status(400).json({ error: "Invalid resume ID format" });
    }

    // Find the resume first to check authorization
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    // Check if user is authorized to delete this resume
    if (
      resume.userId.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this resume" });
    }

    // Delete both resume and associated ATS analyses
    await Promise.all([
      Resume.findByIdAndDelete(resumeId),
      ATSAnalysis.deleteMany({ resumeId }),
    ]);

    res.json({
      message: "Resume and associated analyses deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting resume:", error);
    res.status(500).json({
      error: "Failed to delete resume",
      details: error.message,
    });
  }
});

/**
 * @route GET /api/resumes/user-resume/:userId
 * @desc Get a user's resume by userId
 * @access Private
 */
router.get("/user-resume/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Find the most recent resume for the specified user
    const resume = await Resume.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    }).sort({ uploadDate: -1 });

    if (!resume) {
      return res.status(404).json({
        error: "Resume not found",
        message: "No resume found for this user",
      });
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
      },
    });
  } catch (error) {
    console.error("Error retrieving user resume:", error);
    res.status(500).json({
      error: "Failed to retrieve user resume",
      details: error.message,
    });
  }
});

/**
 * @route GET /api/users
 * @desc Get all users (for admin or recruiters)
 * @access Private
 */
router.get("/users", authMiddleware, async (req, res) => {
  try {
    // This assumes you have a User model and this route would be added to the appropriate router
    // For example, in a userRoutes.js file
    const users = await User.find({}, 'name email role');
    
    res.json({
      message: "Users retrieved successfully",
      users
    });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({
      error: "Failed to retrieve users",
      details: error.message
    });
  }
});

module.exports = router;
