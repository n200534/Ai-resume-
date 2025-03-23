const express = require("express");
const { predictJobSuccess } = require("../services/jobMatchingservice");
const Job = require("../models/JobModel");
const { authMiddleware, roleMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// Post a Job
router.post("/create", authMiddleware, roleMiddleware("recruiter"), async (req, res) => {
  const newJob = new Job({ ...req.body, postedBy: req.user.userId });
  await newJob.save();
  res.json({ message: "Job posted successfully", job: newJob });
});

// Get Job Recommendations
router.get("/match-jobs", authMiddleware, async (req, res) => {
  const resume = await Resume.findOne({ userId: req.user.userId });
  if (!resume) return res.status(404).json({ error: "Resume not found" });

  const jobs = await Job.find();
  const matchedJobs = jobs.map(job => ({
    ...job.toObject(),
    matchScore: predictJobSuccess(resume, job)
  }));

  res.json({ matchedJobs });
});

module.exports = router;
