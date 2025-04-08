const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String,
    required: true, 
    enum: ["candidate", "recruiter"]
  },
  // Reference to the user's current resume
  currentResume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model("User", UserSchema);