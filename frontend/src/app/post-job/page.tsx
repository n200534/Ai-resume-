"use client";

import React, { useState, useEffect } from "react";
import { FileText, CheckCircle2, Users, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock candidate data
const mockCandidates = [
  {
    id: 1,
    name: "John Doe",
    avatar: "/api/placeholder/150/150",
    matchScore: 85,
    skills: ["React", "TypeScript", "Node.js"],
    experience: "Senior Software Engineer",
  },
  {
    id: 2,
    name: "Emily Chen",
    avatar: "/api/placeholder/150/150",
    matchScore: 78,
    skills: ["Python", "Machine Learning", "Data Science"],
    experience: "Data Scientist",
  },
  {
    id: 3,
    name: "Michael Rodriguez",
    avatar: "/api/placeholder/150/150",
    matchScore: 92,
    skills: ["Cloud Architecture", "AWS", "Kubernetes"],
    experience: "DevOps Engineer",
  },
  {
    id: 4,
    name: "Sarah Kim",
    avatar: "/api/placeholder/150/150",
    matchScore: 80,
    skills: ["UI/UX", "Design System", "Figma"],
    experience: "Product Designer",
  },
  {
    id: 5,
    name: "Alex Johnson",
    avatar: "/api/placeholder/150/150",
    matchScore: 88,
    skills: ["Backend", "Java", "Spring Boot"],
    experience: "Backend Engineer",
  },
  {
    id: 6,
    name: "Rachel Green",
    avatar: "/api/placeholder/150/150",
    matchScore: 75,
    skills: ["QA", "Test Automation", "Selenium"],
    experience: "QA Engineer",
  },
];

export default function RecruiterJobPostPage() {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
    skills: "",
    location: "",
    salary: "",
    requiredExperience: "",
    employmentType: "Full-time", // Updated to match schema enum
    expiryDate: ""
  });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [jobPosted, setJobPosted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle job posting
  const handlePostJob = async () => {
    // Reset error state
    setError("");
    
    // Basic validation
    if (
      !formData.title ||
      !formData.company ||
      !formData.description ||
      !formData.skills ||
      !formData.location
    ) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setIsLoading(true);
      
      // Get the authentication token from localStorage
      const token = localStorage.getItem('token'); 
      
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      
      // Parse skills into an array
      const skillsArray = formData.skills.split(',').map(skill => skill.trim());
      
      // Parse required experience to a number
      let experienceNumber = 0;
      if (formData.requiredExperience) {
        const match = formData.requiredExperience.match(/\d+/);
        if (match) {
          experienceNumber = parseInt(match[0], 10);
        }
      }
      
      // Parse salary if provided
      let salary = {};
      if (formData.salary) {
        const salaryMatch = formData.salary.match(/\$?([\d,]+)\s*-\s*\$?([\d,]+)/);
        if (salaryMatch) {
          salary = {
            min: parseInt(salaryMatch[1].replace(/,/g, ''), 10),
            max: parseInt(salaryMatch[2].replace(/,/g, ''), 10),
            currency: 'USD'
          };
        }
      }
      
      // Create the payload to match backend schema
      const jobPayload = {
        title: formData.title,
        company: formData.company,
        description: formData.description,
        skills: skillsArray,
        location: formData.location,
        salary: Object.keys(salary).length > 0 ? salary : undefined,
        requiredExperience: experienceNumber,
        employmentType: formData.employmentType,
        expiryDate: formData.expiryDate || undefined
      };
      
      // Call the API endpoint
      const response = await fetch("http://localhost:5001/api/jobs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(jobPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to post job");
      }

      // Show success popup
      setShowSuccessPopup(true);
      setJobPosted(true);

      // Reset form data
      setFormData({
        title: "",
        company: "",
        description: "",
        skills: "",
        location: "",
        salary: "",
        requiredExperience: "",
        employmentType: "Full-time",
        expiryDate: ""
      });

      // Automatically hide popup after 3 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);
    } catch (err) {
      setError(err.message || "An error occurred while posting the job");
    } finally {
      setIsLoading(false);
    }
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showSuccessPopup) {
        setShowSuccessPopup(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showSuccessPopup]);

  return (
    <div className="w-full px-4 py-8">
      {/* Job Posting Form */}
      <div className="mx-auto mb-12 max-w-2xl">
        <h1 className="text-3xl font-bold text-[#162660] mb-6 text-center flex justify-center items-center">
          <FileText className="mr-3 text-[#162660]" />
          Post a New Job
        </h1>

        {error && (
          <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <div>
            <label className="block text-[#162660] font-semibold mb-2">
              Position Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#162660]"
              placeholder="e.g. Senior Software Engineer"
            />
          </div>

          <div>
            <label className="block text-[#162660] font-semibold mb-2">
              Company <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#162660]"
              placeholder="e.g. Acme Inc."
            />
          </div>

          <div>
            <label className="block text-[#162660] font-semibold mb-2">
              Employment Type <span className="text-red-500">*</span>
            </label>
            <select
              name="employmentType"
              value={formData.employmentType}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#162660]"
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Freelance">Freelance</option>
              <option value="Internship">Internship</option>
            </select>
          </div>

          <div>
            <label className="block text-[#162660] font-semibold mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#162660]"
              placeholder="e.g. San Francisco, CA or Remote"
            />
          </div>

          <div>
            <label className="block text-[#162660] font-semibold mb-2">
              Required Skills <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#162660]"
              placeholder="e.g. React, TypeScript, Node.js"
            />
          </div>

          <div>
            <label className="block text-[#162660] font-semibold mb-2">
              Experience Required
            </label>
            <input
              type="text"
              name="requiredExperience"
              value={formData.requiredExperience}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#162660]"
              placeholder="e.g. 2+ years"
            />
          </div>

          <div>
            <label className="block text-[#162660] font-semibold mb-2">
              Salary Range
            </label>
            <input
              type="text"
              name="salary"
              value={formData.salary}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#162660]"
              placeholder="e.g. $80,000 - $120,000"
            />
          </div>

          <div>
            <label className="block text-[#162660] font-semibold mb-2">
              Expiry Date
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#162660]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[#162660] font-semibold mb-2">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#162660]"
              placeholder="Detailed job description..."
            />
          </div>

          <div className="md:col-span-2">
            <Button
              onClick={handlePostJob}
              disabled={isLoading}
              className="w-full bg-[#162660] text-white hover:bg-[#111B4A] transition-colors py-3"
            >
              {isLoading ? "Posting..." : "Post Job"}
            </Button>
          </div>
        </div>
      </div>

      {/* Recommended Candidates Section */}
      <div className="w-full px-4">
        <h2 className="text-3xl font-bold text-[#162660] mb-6 text-center flex justify-center items-center">
          <Users className="mr-3 text-[#162660]" />
          Recommended Candidates
        </h2>

        {jobPosted ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
            {mockCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow w-full"
              >
                <img
                  src={candidate.avatar}
                  alt={candidate.name}
                  className="w-24 h-24 rounded-full mb-4 object-cover border-4 border-[#162660]/10"
                />
                <h3 className="text-lg font-semibold text-[#162660] mb-1">
                  {candidate.name}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  {candidate.experience}
                </p>
                <div className="flex space-x-2 mb-4 justify-center">
                  {candidate.skills.slice(0, 2).map((skill, index) => (
                    <span
                      key={index}
                      className="bg-[#162660]/10 text-[#162660] text-xs px-2 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-xl font-bold text-green-600 mr-2">
                    {candidate.matchScore}%
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center text-[#162660] hover:bg-[#162660] hover:text-white"
                  >
                    <Eye className="mr-2" size={16} /> View Profile
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#162660]/5 p-6 rounded-xl text-center text-[#162660]/70">
            <Search className="mx-auto mb-4 text-[#162660]/50" size={48} />
            <p>Post a job to see recommended candidates</p>
          </div>
        )}
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center">
            <CheckCircle2 className="mx-auto text-green-500 mb-4" size={64} />
            <h2 className="text-2xl font-bold text-[#162660] mb-2">
              Job Posted Successfully!
            </h2>
            <p className="text-gray-600">Your job listing is now live.</p>
          </div>
        </div>
      )}
    </div>
  );
}