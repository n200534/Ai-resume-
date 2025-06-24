const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const fileUpload = require("express-fileupload");

// require("@dotenvx/dotenvx").config();\

console.log(process.env.JWT_SECRET);
console.log(process.env.GEMINI_API_KEY);
const app = express();

// Define allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000", // Local development
  "https://jobfitai-delta.vercel.app", // Deployed frontend on Vercel
  "https://jobfitai-e3rlq2zr8-n200534s-projects.vercel.app",
  "https://jobfitai-n200534s-projects.vercel.app",
  "https://ai-resume-mu-nine.vercel.app"
];

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl requests)
      if (!origin) return callback(null, true);
      // Check if the request origin is in the allowedOrigins list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow sending cookies/auth headers
  })
);
app.use(fileUpload());

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
