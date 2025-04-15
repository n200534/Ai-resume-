// routes/jobRoutes.js
const express = require("express");
const mongoose = require("mongoose");
const {
  predictJobSuccess,
  semanticJobMatching,
} = require("../services/jobMatchingService");
const Job = require("../models/JobModel");
const Resume = require("../models/ResumeModel");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @route GET /api/jobs/my-jobs
 * @desc Get all jobs posted by the current user
 * @access Private
 */
// IMPORTANT: Moved this route before the /:jobId route to ensure correct routing
router.get("/my-jobs", authMiddleware, async (req, res) => {
  try {
    // Check if req.user and req.user.userId exist
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        error: "User not authenticated properly",
        details: "Authentication information is missing",
      });
    }

    // Safely convert userId to ObjectId, handling potential invalid format
    let userId;
    try {
      userId = new mongoose.Types.ObjectId(req.user.userId);
    } catch (error) {
      return res.status(400).json({
        error: "Invalid user ID format",
        details: "The user ID format is not valid",
      });
    }

    // Debug logging
    console.log("Fetching jobs for user:", userId);

    // Find jobs where the current user is the poster
    const jobs = await Job.find({ postedBy: userId })
      .sort({ postedDate: -1 })
      .populate("postedBy", "name company")
      .exec();

    console.log(`Found ${jobs.length} jobs for user ${userId}`);

    res.json({
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("Error fetching user's jobs:", error);
    res.status(500).json({
      error: "Failed to fetch your jobs",
      details: error.message,
    });
  }
});

/**
 * @route POST /api/jobs/create
 * @desc Create a new job posting
 * @access Private (Recruiters only)
 */
router.post(
  "/create",
  authMiddleware,
  roleMiddleware("recruiter"),
  async (req, res) => {
    try {
      const {
        title,
        company,
        description,
        skills,
        location,
        salary,
        requiredExperience,
        employmentType,
        expiryDate,
      } = req.body;

      // Validate required fields
      if (!title || !company || !description || !skills || !location) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Process skills array (handle both comma-separated string and array)
      let skillsArray = skills;
      if (typeof skills === "string") {
        skillsArray = skills.split(",").map((skill) => skill.trim());
      }

      // Make sure the userId is valid
      if (!req.user || !req.user.userId) {
        return res
          .status(401)
          .json({ error: "User not authenticated properly" });
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
        postedBy: new mongoose.Types.ObjectId(req.user.userId),
      });

      await newJob.save();

      res.json({
        message: "Job posted successfully",
        job: newJob,
      });
    } catch (error) {
      console.error("Job creation error:", error);
      res.status(500).json({
        error: "Failed to create job",
        details: error.message,
      });
    }
  }
);

/**
 * @route GET /api/jobs
 * @desc Get all jobs with optional filtering and pagination
 * @access Public
 */
router.get("/", async (req, res) => {
  try {
    const {
      search,
      skills,
      location,
      experience,
      type,
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    // Add text search if provided
    if (search) {
      filter.$text = { $search: search };
    }

    // Add skills filter if provided
    if (skills) {
      const skillsArray = skills.split(",").map((skill) => skill.trim());
      filter.skills = { $in: skillsArray };
    }

    // Add location filter if provided
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    // Add experience filter if provided
    if (experience) {
      filter.requiredExperience = { $lte: Number(experience) };
    }

    // Add employment type filter if provided
    if (type) {
      filter.employmentType = type;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pageLimit = parseInt(limit);

    // Count total matching documents for pagination info
    const total = await Job.countDocuments(filter);

    // Fetch jobs with filter and pagination
    const jobs = await Job.find(filter)
      .sort({ postedDate: -1 })
      .skip(skip)
      .limit(pageLimit)
      .populate("postedBy", "name company")
      .exec();

    res.json({
      jobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({
      error: "Failed to fetch jobs",
      details: error.message,
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
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "User not authenticated properly" });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    // Find user's most recent resume
    const resume = await Resume.findOne({ userId })
      .sort({ uploadDate: -1 })
      .exec();

    if (!resume) {
      return res.status(404).json({
        error: "Resume not found",
        message: "Please upload your resume first to get job recommendations.",
      });
    }

    // Get active jobs
    const jobs = await Job.find({ isActive: true })
      .sort({ postedDate: -1 })
      .populate("postedBy", "name company");

    // Calculate match score for each job
    const matchedJobs = await Promise.all(
      jobs.map(async (job) => {
        // Use semantic matching for more detailed analysis
        const jobObject = job.toObject();

        // Basic match calculation
        const matchScore = predictJobSuccess(resume, jobObject);

        // More detailed semantic matching if we have raw text
        let semanticMatch = null;
        if (resume.rawText && job.description) {
          semanticMatch = await semanticJobMatching(
            resume.rawText,
            job.description
          );
        }

        return {
          ...jobObject,
          matchScore: semanticMatch ? semanticMatch.score : matchScore,
          matchDetails: semanticMatch,
        };
      })
    );

    // Sort by match score (highest first)
    matchedJobs.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      message: "Job recommendations generated successfully",
      count: matchedJobs.length,
      matchedJobs,
    });
  } catch (error) {
    console.error("Error generating job recommendations:", error);
    res.status(500).json({
      error: "Failed to generate job recommendations",
      details: error.message,
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
    // Safely convert userId to ObjectId
    const userId = new mongoose.Types.ObjectId(req.user.userId);

    // Find user's latest resume
    const resume = await Resume.findOne({ userId })
      .sort({ uploadDate: -1 })
      .exec();

    if (!resume) {
      return res.json({
        count: 0,
        recommendedJobs: [],
        message:
          "No resume found. Please upload your resume to get job recommendations.",
      });
    }

    // Get active jobs with pagination
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pageLimit = parseInt(limit);

    const jobs = await Job.find({ isActive: true })
      .sort({ postedDate: -1 })
      .skip(skip)
      .limit(pageLimit)
      .populate("postedBy", "name company");

    // Map jobs with try/catch for each job
    const matchedJobs = [];

    for (const job of jobs) {
      try {
        const jobObject = job.toObject();
        const matchScore = predictJobSuccess(resume, jobObject);

        // Include all jobs with their match scores
        matchedJobs.push({
          ...jobObject,
          matchScore,
        });
      } catch (error) {
        console.error(`Error processing job ${job._id}:`, error);
        // Skip this job
      }
    }

    // Sort by match score (highest first)
    matchedJobs.sort((a, b) => b.matchScore - a.matchScore);

    // Get total count for pagination
    const total = await Job.countDocuments({ isActive: true });

    res.json({
      recommendedJobs: matchedJobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    console.error("Error fetching recommended jobs:", error);
    res.status(500).json({
      error: "Failed to fetch recommended jobs",
      details: error.message,
    });
  }
});

/**
 * @route GET /api/jobs/:jobId
 * @desc Get a specific job by ID
 * @access Public (with optional auth for match score)
 */
router.get("/:jobId", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({ error: "Invalid job ID format" });
    }

    const job = await Job.findById(req.params.jobId)
      .populate("postedBy", "name company")
      .exec();

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const response = { job };

    // If user is authenticated, calculate match score
    if (req.user) {
      try {
        const userId = new mongoose.Types.ObjectId(req.user.userId);
        const resume = await Resume.findOne({ userId })
          .sort({ uploadDate: -1 })
          .exec();

        if (resume) {
          response.matchScore = predictJobSuccess(resume, job);
        }
      } catch (error) {
        console.error("Error calculating match score:", error);
        // Continue without match score
      }
    }

    res.json(response);
  } catch (error) {
    console.error("Error fetching job details:", error);
    res.status(500).json({
      error: "Failed to fetch job details",
      details: error.message,
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
    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({ error: "Invalid job ID format" });
    }

    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Check if user is the job creator or admin
    if (
      job.postedBy.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this job" });
    }

    // Process skills array if provided
    if (req.body.skills && typeof req.body.skills === "string") {
      req.body.skills = req.body.skills.split(",").map((skill) => skill.trim());
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.jobId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({
      message: "Job updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({
      error: "Failed to update job",
      details: error.message,
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
    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({ error: "Invalid job ID format" });
    }

    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Check if user is the job creator or admin
    if (
      job.postedBy.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this job" });
    }

    await Job.findByIdAndDelete(req.params.jobId);

    res.json({
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({
      error: "Failed to delete job",
      details: error.message,
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
    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({ error: "Invalid job ID format" });
    }

    // Find the job
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    // Check if user has already applied
    const alreadyApplied = job.applicants.some(
      (applicant) => applicant.userId.toString() === req.user.userId
    );

    if (alreadyApplied) {
      return res
        .status(400)
        .json({ error: "You have already applied for this job" });
    }

    // Find user's latest resume
    const resume = await Resume.findOne({ userId })
      .sort({ uploadDate: -1 })
      .exec();

    if (!resume) {
      return res.status(404).json({
        error: "Resume not found",
        message: "Please upload your resume first before applying.",
      });
    }

    // Calculate match score
    const matchScore = predictJobSuccess(resume, job);

    // Add user to applicants
    job.applicants.push({
      userId,
      resumeId: resume._id,
      matchScore: matchScore,
      appliedDate: new Date(),
    });

    await job.save();

    res.json({
      message: "Application submitted successfully",
      matchScore: matchScore,
    });
  } catch (error) {
    console.error("Error applying for job:", error);
    res.status(500).json({
      error: "Failed to submit application",
      details: error.message,
    });
  }
});

/**
 * @route GET /api/jobs/:jobId/applicants
 * @desc Get all applicants for a specific job
 * @access Private (Job creator only)
 */
router.get("/:jobId/applicants", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({ error: "Invalid job ID format" });
    }

    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Check if user is the job creator or admin
    if (
      job.postedBy.toString() !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to view applicants for this job" });
    }

    // Get detailed applicant information
    const applicantsWithDetails = await Promise.all(
      job.applicants.map(async (applicant) => {
        try {
          // Get user info (assuming you have a User model)
          const User = mongoose.model("User");
          const user = await User.findById(applicant.userId, "name email");

          // Get resume info
          const resume = await Resume.findById(applicant.resumeId);

          return {
            ...applicant.toObject(),
            user: user ? user.toObject() : null,
            resumeDetails: resume
              ? {
                  fileName: resume.fileName,
                  fileSize: resume.fileSize,
                }
              : null,
          };
        } catch (err) {
          console.error(
            `Error fetching details for applicant ${applicant.userId}:`,
            err
          );
          return applicant.toObject();
        }
      })
    );

    // Sort by match score (highest first)
    applicantsWithDetails.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      count: applicantsWithDetails.length,
      applicants: applicantsWithDetails,
    });
  } catch (error) {
    console.error("Error fetching job applicants:", error);
    res.status(500).json({
      error: "Failed to fetch applicants",
      details: error.message,
    });
  }
});

/**
 * @route GET /api/applications/status
 * @desc Get application status for the current user (which jobs they've applied to)
 * @access Private
 */
router.get("/applications/status", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "User not authenticated properly" });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    // Find all jobs where the current user is an applicant
    const jobs = await Job.find(
      {
        "applicants.userId": userId,
      },
      {
        _id: 1, // Only return the job ID
        "applicants.$": 1, // And the matching applicant
      }
    );

    // Format the response to include jobId and application date
    const applications = jobs.map((job) => {
      const applicant = job.applicants.find(
        (app) => app.userId.toString() === userId.toString()
      );

      return {
        jobId: job._id,
        appliedDate: applicant.appliedDate,
        status: "applied", // You can expand this if you track different statuses
      };
    });

    res.json({
      applications,
    });
  } catch (error) {
    console.error("Error fetching application status:", error);
    res.status(500).json({
      error: "Failed to fetch application status",
      details: error.message,
    });
  }
});

module.exports = router;
