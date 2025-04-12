"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

const sampleJobs = [
  {
    id: 1,
    title: "Full-Stack Developer",
    company: "Tech Corp",
    location: "Remote",
    employmentType: "Full-time",
    experience: "3+ years",
    description:
      "We are looking for a skilled Full Stack Developer to build and maintain modern web applications. The ideal candidate should be proficient in both front-end and back-end technologies such as React, Node.js or Python, and have experience working with databases like MongoDB or PostgreSQL. You'll collaborate with cross-functional teams to deliver scalable, high-performance solutions while following best coding practices.",
  },
  {
    id: 2,
    title: "MERN Stack Developer",
    company: "Dev Hub",
    location: "Remote",
    employmentType: "Full-time",
    experience: "2+ years",
    description:
      "Seeking a talented MERN stack developer who is proficient in MongoDB, Express.js, React, and Node.js. You'll build scalable solutions and collaborate closely with designers and product managers to deliver exceptional features.",
  },
  {
    id: 3,
    title: "Full-stack Engineer",
    company: "InnoTech",
    location: "Bangalore, India",
    employmentType: "Part-time",
    experience: "1+ years",
    description:
      "InnoTech is hiring a full-stack engineer to work on innovative products. Should be skilled in JavaScript, Node.js, RESTful APIs, and modern front-end frameworks like React or Vue.",
  },
  // Added more jobs to demonstrate scrolling
  {
    id: 4,
    title: "Frontend Developer",
    company: "WebSolutions",
    location: "New York, USA",
    employmentType: "Full-time",
    experience: "2+ years",
    description:
      "Looking for a talented Frontend Developer with strong React skills to join our growing team.",
  },
  {
    id: 5,
    title: "Backend Engineer",
    company: "DataFlow",
    location: "Remote",
    employmentType: "Contract",
    experience: "3+ years",
    description:
      "Seeking a Backend Engineer with Node.js expertise to build scalable APIs and services.",
  },
  {
    id: 6,
    title: "DevOps Engineer",
    company: "CloudTech",
    location: "San Francisco, USA",
    employmentType: "Full-time",
    experience: "4+ years",
    description:
      "Join our DevOps team to build and maintain cloud infrastructure for our growing platform.",
  },
  {
    id: 7,
    title: "Full-Stack Developer",
    company: "Tech Corp",
    location: "Remote",
    employmentType: "Full-time",
    experience: "3+ years",
    description:
      "We are looking for a skilled Full Stack Developer to build and maintain modern web applications. The ideal candidate should be proficient in both front-end and back-end technologies such as React, Node.js or Python, and have experience working with databases like MongoDB or PostgreSQL. You'll collaborate with cross-functional teams to deliver scalable, high-performance solutions while following best coding practices.",
  },
  {
    id: 8,
    title: "MERN Stack Developer",
    company: "Dev Hub",
    location: "Remote",
    employmentType: "Full-time",
    experience: "2+ years",
    description:
      "Seeking a talented MERN stack developer who is proficient in MongoDB, Express.js, React, and Node.js. You'll build scalable solutions and collaborate closely with designers and product managers to deliver exceptional features.",
  },
  {
    id: 9,
    title: "Full-stack Engineer",
    company: "InnoTech",
    location: "Bangalore, India",
    employmentType: "Part-time",
    experience: "1+ years",
    description:
      "InnoTech is hiring a full-stack engineer to work on innovative products. Should be skilled in JavaScript, Node.js, RESTful APIs, and modern front-end frameworks like React or Vue.",
  },
  // Added more jobs to demonstrate scrolling
  {
    id: 10,
    title: "Frontend Developer",
    company: "WebSolutions",
    location: "New York, USA",
    employmentType: "Full-time",
    experience: "2+ years",
    description:
      "Looking for a talented Frontend Developer with strong React skills to join our growing team.",
  },
  {
    id: 11,
    title: "Backend Engineer",
    company: "DataFlow",
    location: "Remote",
    employmentType: "Contract",
    experience: "3+ years",
    description:
      "Seeking a Backend Engineer with Node.js expertise to build scalable APIs and services.",
  },
  {
    id: 12,
    title: "DevOps Engineer",
    company: "CloudTech",
    location: "San Francisco, USA",
    employmentType: "Full-time",
    experience: "4+ years",
    description:
      "Join our DevOps team to build and maintain cloud infrastructure for our growing platform.",
  },
];

export default function ViewJobPage() {
  const [jobs, setJobs] = useState(sampleJobs);
  const [selectedJob, setSelectedJob] = useState(sampleJobs[0]);

  const handleRemove = (id: number) => {
    const updatedJobs = jobs.filter((job) => job.id !== id);
    setJobs(updatedJobs);
    if (selectedJob?.id === id && updatedJobs.length > 0) {
      setSelectedJob(updatedJobs[0]);
    } else if (updatedJobs.length === 0) {
      setSelectedJob(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-4">
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-md flex overflow-hidden h-screen">
        {/* Left Side: Job List */}
        <div className="w-1/3 border-r border-gray-300 p-4 overflow-y-auto h-full">
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            Top job picks for you
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Based on your resume skills and interests
          </p>
          <div className="space-y-2 overflow-y-auto">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`bg-gray-100 p-3 rounded flex items-center justify-between hover:bg-gray-200 transition cursor-pointer ${
                  selectedJob?.id === job.id
                    ? "border-l-4 border-[#162660]"
                    : ""
                }`}
                onClick={() => setSelectedJob(job)}
              >
                <div>
                  <div className="text-sm font-semibold">{job.title}</div>
                  <div className="text-xs text-gray-600">{job.company}</div>
                  <div className="text-xs text-gray-400">{job.location}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(job.id);
                  }}
                  className="text-black text-lg font-bold hover:opacity-70 transition"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Job Detail */}
        <div className="w-2/3 p-8 overflow-y-auto h-full">
          {selectedJob ? (
            <>
              <div className="text-gray-700 mb-4">
                <div className="text-2xl font-semibold">
                  {selectedJob.title}
                </div>
                <div className="text-sm text-gray-500">
                  {selectedJob.company}
                </div>
                <div className="text-sm text-gray-500">
                  {selectedJob.location}
                </div>
              </div>

              <div className="mb-4 flex gap-3">
                <Button className="bg-[#162660] text-white">Apply</Button>
                <Button variant="outline">ATS Score</Button>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">About the Job</h3>
                <ul className="text-sm text-gray-800 mb-2">
                  <li>
                    <strong>Job Title:</strong> {selectedJob.title}
                  </li>
                  <li>
                    <strong>Employment Type:</strong>{" "}
                    {selectedJob.employmentType}
                  </li>
                  <li>
                    <strong>Experience:</strong> {selectedJob.experience}
                  </li>
                  <li>
                    <strong>Location:</strong> {selectedJob.location}
                  </li>
                </ul>
                <h4 className="font-semibold mb-1">Description:</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedJob.description}
                </p>
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-sm">No job selected</div>
          )}
        </div>
      </div>
    </div>
  );
}
