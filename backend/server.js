const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
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
  .connect("mongodb+srv://amavarapuakshaykumar:akshay_321@cluster0.fxgc0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => {
    app.listen(5001, () => {
      console.log("Database connected and server running at port 5000");
    });
  })
  .catch((err) => console.log(err));
