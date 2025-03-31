// models/JobModel.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  skills: {
    type: [String],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  requiredExperience: {
    type: Number,
    default: 0
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'],
    default: 'Full-time'
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['applied', 'reviewing', 'shortlisted', 'rejected', 'hired'],
      default: 'applied'
    },
    applicationDate: {
      type: Date,
      default: Date.now
    },
    matchScore: {
      type: Number,
      default: 0
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for search functionality
jobSchema.index({ title: 'text', description: 'text', skills: 'text' });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;