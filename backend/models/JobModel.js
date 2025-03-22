const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Recruiter who posted the job
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  requiredSkills: { type: [String], required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Job", JobSchema);
