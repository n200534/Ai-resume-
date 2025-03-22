const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Link to user
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  skills: { type: [String] },
  experience: { type: String },
  education: { type: String },
  extractedText: { type: String, required: true },
  aiFeedback: { type: String }, // AI-generated feedback from Gemini Flash
  jobMatches: [{ jobId: mongoose.Schema.Types.ObjectId, score: Number }], // Job matching scores
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Resume", ResumeSchema);
