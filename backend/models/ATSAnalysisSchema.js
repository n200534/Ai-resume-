const mongoose = require('mongoose');
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

const ATSAnalysis = mongoose.model('ATSAnalysis', ATSAnalysisSchema);
module.exports=ATSAnalysis;