const express = require("express");
const { authMiddleware, roleMiddleware } = require("../middlewares/authMiddleware");
const Job = require("../models/JobModel");

const router = express.Router();

// Create a new Job (Only for Recruiters)
router.post("/create", authMiddleware, roleMiddleware("recruiter"), async (req, res) => {
  try {
    const { title, company, description, requiredSkills } = req.body;

    if (!title || !company || !description || !requiredSkills) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newJob = new Job({
      recruiterId: req.user.userId,
      title,
      company,
      description,
      requiredSkills,
    });

    await newJob.save();
    res.json({ message: "Job posted successfully", job: newJob });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
