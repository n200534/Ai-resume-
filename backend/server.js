const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
// require("dotenv").config();
console.log("JWT:", process.env.JWT);
process.env.JWT;
const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Only allow your frontend
    credentials: true, // Allow sending cookies/auth headers
  })
);

app.use(express.json());

// Import Models
require("./models/UserModel");
require("./models/ResumeModel");
require("./models/JobModel");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const jobRoutes = require("./routes/jobRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/jobs", jobRoutes);

// MongoDB Connection
mongoose
  .connect(
    "mongodb+srv://amavarapuakshaykumar:akshay_321@cluster0.fxgc0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    app.listen(5001, () => {
      console.log("Database connected and server running at port 5001");
    });
  })
  .catch((err) => console.log(err));

module.exports = router;
