// routes/jobRoutes.js
const express = require("express");
const { predictJobSuccess, semanticJobMatching } = require("../services/jobMatchingService");
const Job = require("../models/JobModel");
const Resume = require("../models/ResumeModel");
const { authMiddleware, roleMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @route POST /api/jobs/create
 * @desc Create a new job posting
 * @access Private (Recruiters only)
 */
router.post("/create", authMiddleware, roleMiddleware("recruiter"), async (req, res) => {
  try {
    const { title, company, description, skills, location, salary, requiredExperience, employmentType, expiryDate } = req.body;
    
    // Validate required fields
    if (!title || !company || !description || !skills || !location) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Process skills array (handle both comma-separated string and array)
    let skillsArray = skills;
    if (typeof skills === 'string') {
      skillsArray = skills.split(',').map(skill => skill.trim());
    }
    
    const newJob = new Job({
      title,
      company,
      description,
      skills: skillsArray,
      location,
      salary,
      requiredExperience,
      employmentType,
      expiryDate,
      postedBy: req.user.userId
    });
    
    await newJob.save();
    
    res.json({ 
      message: "Job posted successfully", 
      job: newJob 
    });
  } catch (error) {
    console.error("Job creation error:", error);
    res.status(500).json({ 
      error: "Failed to create job",
      details: error.message
    });
  }
});

/**
 * @route GET /api/jobs
 * @desc Get all jobs with optional filtering
 * @access Public
 */
router.get("/", async (req, res) => {
  try {
    const { search, skills, location, experience, type } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    
    // Add text search if provided
    if (search) {
      filter.$text = { $search: search };
    }
    
    // Add skills filter if provided
    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      filter.skills = { $in: skillsArray };
    }
    
    // Add location filter if provided
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    
    // Add experience filter if provided
    if (experience) {
      filter.requiredExperience = { $lte: Number(experience) };
    }
    
    // Add employment type filter if provided
    if (type) {
      filter.employmentType = type;
    }
    
    // Fetch jobs with filter
    const jobs = await Job.find(filter)
      .sort({ postedDate: -1 })
      .populate('postedBy', 'name company')
      .exec();
    
    res.json({
      count: jobs.length,
      jobs
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({
      error: "Failed to fetch jobs",
      details: error.message
    });
  }
});

/**
 * @route GET /api/jobs/match-jobs
 * @desc Get job recommendations based on user's resume
 * @access Private
 */
router.get("/match-jobs", authMiddleware, async (req, res) => {
  try {
    // Find user's resume
    const resume = await Resume.findOne({ userId: req.user.userId }).sort({ uploadDate: -1 });
    
    if (!resume) {
      return res.status(404).json({ error: "Resume not found. Please upload your resume first." });
    }
    
    // Get active jobs
    const jobs = await Job.find({ isActive: true })
      .sort({ postedDate: -1 })
      .populate('postedBy', 'name company');
    
    // Calculate match score for each job
    const matchedJobs = await Promise.all(jobs.map(async job => {
      // Use semantic matching for more detailed analysis
      const jobObject = job.toObject();
      
      // Basic match calculation
      const matchScore = predictJobSuccess(resume, jobObject);
      
      // More detailed semantic matching if we have raw text
      let semanticMatch = null;
      if (resume.rawText && job.description) {
        semanticMatch = semanticJobMatching(resume.rawText, job.description);
      }
      
      return {
        ...jobObject,
        matchScore: semanticMatch ? semanticMatch.score : matchScore,
        matchDetails: semanticMatch
      };
    }));
    
    // Sort by match score (highest first)
    matchedJobs.sort((a, b) => b.matchScore - a.matchScore);
    
    res.json({ 
      message: "Job recommendations generated successfully",
      count: matchedJobs.length,
      matchedJobs 
    });
  } catch (error) {
    console.error("Error generating job recommendations:", error);
    res.status(500).json({
      error: "Failed to generate job recommendations",
      details: error.message
    });
  }
});

/**
 * @route GET /api/jobs/recommended
 * @desc Get highly recommended jobs (75%+ match)
 * @access Private
 */
router.get("/recommended", authMiddleware, async (req, res) => {
  try {
    // Find user's resume
    const resume = await Resume.findOne({ userId: req.user.userId }).sort({ uploadDate: -1 });
    
    if (!resume) {
      return res.status(404).json({ error: "Resume not found. Please upload your resume first." });
    }
    
    // Get active jobs
    const jobs = await Job.find({ isActive: true })
      .sort({ postedDate: -1 })
      .limit(20) // Limit to recent jobs for efficiency
      .populate('postedBy', 'name company');
    
    // Calculate match score for each job
    const matchedJobs = jobs.map(job => {
      const jobObject = job.toObject();
      const matchScore = predictJobSuccess(resume, jobObject);
      
      return {
        ...jobObject,
        matchScore
      };
    });
    
    // Filter to only high matches and sort
    const recommendedJobs = matchedJobs
      .filter(job => job.matchScore >= 75)
      .sort((a, b) => b.matchScore - a.matchScore);
    
    res.json({ 
      count: recommendedJobs.length,
      recommendedJobs 
    });
  } catch (error) {
    console.error("Error fetching recommended jobs:", error);
    res.status(500).json({
      error: "Failed to fetch recommended jobs",
      details: error.message
    });
  }
});

/**
 * @route GET /api/jobs/:jobId
 * @desc Get a specific job by ID
 * @access Public
 */
router.get("/:jobId", async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId)
      .populate('postedBy', 'name company')
      .exec();
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    // If logged in and has resume, calculate match score
    let matchScore = null;
    if (req.user) {
      const resume = await Resume.findOne({ userId: req.user.userId });
      if (resume) {
        matchScore = predictJobSuccess(resume, job);
      }
    }
    
    res.json({
      job,
      matchScore
    });
  } catch (error) {
    console.error("Error fetching job details:", error);
    res.status(500).json({
      error: "Failed to fetch job details",
      details: error.message
    });
  }
});

/**
 * @route PUT /api/jobs/:jobId
 * @desc Update a job posting
 * @access Private (Job creator only)
 */
router.put("/:jobId", authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    // Check if user is the job creator or admin
    if (job.postedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized to update this job" });
    }
    
    // Process skills array if provided
    if (req.body.skills && typeof req.body.skills === 'string') {
      req.body.skills = req.body.skills.split(',').map(skill => skill.trim());
    }
    
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.jobId,
      { $set: req.body },
      { new: true }
    );
    
    res.json({
      message: "Job updated successfully",
      job: updatedJob
    });
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({
      error: "Failed to update job",
      details: error.message
    });
  }
});

/**
 * @route DELETE /api/jobs/:jobId
 * @desc Delete a job posting
 * @access Private (Job creator only)
 */
router.delete("/:jobId", authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    // Check if user is the job creator or admin
    if (job.postedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Not authorized to delete this job" });
    }
    
    await Job.findByIdAndDelete(req.params.jobId);
    
    res.json({
      message: "Job deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({
      error: "Failed to delete job",
      details: error.message
    });
  }
});

/**
 * @route POST /api/jobs/:jobId/apply
 * @desc Apply for a job
 * @access Private
 */
router.post("/:jobId/apply", authMiddleware, async (req, res) => {
  try {
    // Find the job
    const job = await Job.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    // Check if user has already applied
    const alreadyApplied = job.applicants.some(applicant => 
      applicant.userId.toString() === req.user.userId
    );
    
    if (alreadyApplied) {
      return res.status(400).json({ error: "You have already applied for this job" });
    }
    
    // Find user's resume
    const resume = await Resume.findOne({ userId: req.user.userId });
    
    if (!resume) {
      return res.status(404).json({ error: "Resume not found. Please upload your resume first." });
    }
    
    // Calculate match score
    const matchScore = predictJobSuccess(resume, job);
    
    // Add user to applicants
    job.applicants.push({
      userId: req.user.userId,
      matchScore: matchScore
    });
    
    await job.save();
    
    res.json({
      message: "Application submitted successfully",
      matchScore: matchScore
    });
  } catch (error) {
    console.error("Error applying for job:", error);
    res.status(500).json({
      error: "Failed to submit application",
      details: error.message
    });
  }
});

module.exports = router;