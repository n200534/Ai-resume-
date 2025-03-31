const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  fileName: String,
  rawText: String,
  skills: [String],
  experience: String,
  feedback: String,
  userId: String,
  uploadDate: Date
});

const ATSAnalysisSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  jobDescription: String,
  score: Number,
  matchPercentage: Number,
  feedback: String,
  missingKeywords: [String],
  foundKeywords: [String],
  userId: String,
  analysisDate: Date
});

const Resume = mongoose.model('Resume', ResumeSchema);
const ATSAnalysis = mongoose.model('ATSAnalysis', ATSAnalysisSchema);

module.exports = { Resume, ATSAnalysis };