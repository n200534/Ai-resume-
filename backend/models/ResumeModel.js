const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ResumeSchema = new Schema({
  fileName: String,
  rawText: String,
  skills: [String],
  experience: String,
  feedback: String,
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true  // Add index for better query performance
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

// Add a compound index to ensure uniqueness and for faster queries
ResumeSchema.index({ userId: 1, uploadDate: -1 });

const Resume = mongoose.model('Resume', ResumeSchema);
module.exports = Resume;