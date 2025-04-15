"use client";

import React, { useState, useEffect } from "react";
import { FileText, CheckCircle2, Users, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Candidate {
  userId: string;
  name: string;
  experience?: string;
  skills: string[];
  matchScore: number;
}

interface JobResponse {
  job?: { _id: string };
  error?: string;
}

interface CandidatesResponse {
  candidates?: Candidate[];
  error?: string;
}

interface Resume {
  experience?: string;
  skills?: string[];
  summarizedText?: string;
}

export default function RecruiterJobPostPage() {
  const [formData, setFormData] = useState<{
    title: string;
    company: string;
    description: string;
    skills: string;
    location: string;
    salary: string;
    requiredExperience: string;
    employmentType:
      | "Full-time"
      | "Part-time"
      | "Contract"
      | "Freelance"
      | "Internship";
    expiryDate: string;
  }>({
    title: "",
    company: "",
    description: "",
    skills: "",
    location: "",
    salary: "",
    requiredExperience: "",
    employmentType: "Full-time",
    expiryDate: "",
  });
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
  const [jobPosted, setJobPosted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [postedJobId, setPostedJobId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState<boolean>(false);
  // Sidebar states
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [candidateDetails, setCandidateDetails] = useState<Resume | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fetch candidate details
  const fetchCandidateDetails = async (userId: string): Promise<void> => {
    const token = localStorage.getItem("token");
    if (!token) {
      setProfileError("Authentication required. Please log in.");
      return;
    }
    if (!userId || typeof userId !== "string") {
      setProfileError("Invalid user ID.");
      setLoadingProfile(false);
      return;
    }
    try {
      setLoadingProfile(true);
      setProfileError(null);
      const response = await fetch(
        `${API_URL}/api/resumes/user-resume/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to fetch resume: ${response.status}`
        );
      }
      const data: { resume: Resume } = await response.json();
      setCandidateDetails(data.resume);
    } catch (err: unknown) {
      setProfileError(
        err instanceof Error ? err.message : "Failed to load candidate details."
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  // Handle view profile
  const handleViewProfile = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowProfile(true);
    fetchCandidateDetails(candidate.userId);
  };

  // Fetch recommended candidates based on job ID
  const fetchRecommendedCandidates = async (jobId: string): Promise<void> => {
    try {
      setLoadingCandidates(true);

      // Get token from localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const response = await fetch(
        `${API_URL}/api/jobs/${jobId}/recommended-candidates`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: CandidatesResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch candidates");
      }

      setCandidates(data.candidates || []);
    } catch (err: unknown) {
      console.error(
        "Error fetching candidates:",
        err instanceof Error ? err.message : "Unknown error"
      );
      // Don't show error to user, just log it
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Handle job posting
  const handlePostJob = async (): Promise<void> => {
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
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Parse skills into an array
      const skillsArray = formData.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill);

      // Parse required experience to a number
      let experienceNumber = 0;
      if (formData.requiredExperience) {
        const match = formData.requiredExperience.match(/\d+/);
        if (match) {
          experienceNumber = parseInt(match[0], 10);
        }
      }

      // Parse salary if provided
      let salary: { min: number; max: number; currency: string } | undefined;
      if (formData.salary) {
        const salaryMatch = formData.salary.match(
          /\$?([\d,]+)\s*-\s*\$?([\d,]+)/
        );
        if (salaryMatch) {
          salary = {
            min: parseInt(salaryMatch[1].replace(/,/g, ""), 10),
            max: parseInt(salaryMatch[2].replace(/,/g, ""), 10),
            currency: "USD",
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
        salary,
        requiredExperience: experienceNumber,
        employmentType: formData.employmentType,
        expiryDate: formData.expiryDate || undefined,
      };

      // Call the API endpoint
      const response = await fetch(`${API_URL}/api/jobs/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(jobPayload),
      });

      const data: JobResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to post job");
      }

      // Store the job ID for fetching candidates
      setPostedJobId(data.job?._id || null);

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
        expiryDate: "",
      });

      // Fetch recommended candidates based on the posted job
      if (data.job?._id) {
        await fetchRecommendedCandidates(data.job._id);
      }

      // Automatically hide popup after 3 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while posting the job"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Close popup and sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (showSuccessPopup) {
        setShowSuccessPopup(false);
      }
      if (showProfile) {
        const sidebar = document.querySelector(".candidate-sidebar");
        if (sidebar && !sidebar.contains(event.target as Node)) {
          setShowProfile(false);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showSuccessPopup, showProfile]);

  return (
    <div className="w-full px-4 py-12 bg-gray-50">
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
      `}</style>

      {/* Job Posting Form */}
      <div className="mx-auto mb-12 max-w-2xl">
        <h1 className="text-3xl font-bold text-[#162660] mb-6 text-center flex justify-center items-center animate-slideUp">
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
      <div className="w-full max-w-7xl mx-auto px-4 mb-12">
        <h2 className="text-3xl font-bold text-[#162660] mb-8 text-center flex justify-center items-center animate-slideUp border-b-2 border-indigo-100 pb-2">
          <Users className="mr-3 text-[#162660]" />
          Recommended Candidates
        </h2>

        {jobPosted ? (
          loadingCandidates ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm animate-pulse"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                      -
                    </div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="h-8 bg-gray-200 rounded-full w-12"></div>
                    <div className="h-10 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : candidates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((candidate) => (
                <div
                  key={candidate.userId}
                  className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-300 animate-fadeIn"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#162660]/10 border border-[#162660]/10 flex items-center justify-center text-[#162660] font-semibold text-xl hover:bg-[#162660]/20 transition-colors"
                      aria-label={`Initial of ${candidate.name || "unknown"}`}
                    >
                      {candidate.name?.charAt(0)?.toUpperCase() || "-"}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#162660]">
                        {candidate.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {candidate.experience || "Professional"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {candidate.skills
                      .slice(0, 3)
                      .map((skill, index: number) => (
                        <span
                          key={`skill-${index}`}
                          className="bg-[#162660]/10 text-[#162660] text-xs font-medium px-2 py-0.5 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="bg-green-50 text-green-700 font-bold text-sm px-3 py-1 rounded-full">
                      {candidate.matchScore}% Match
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#162660] text-[#162660] hover:bg-[#162660] hover:text-white px-4 py-2"
                      aria-label={`View profile of ${
                        candidate.name || "unknown"
                      }`}
                      onClick={() => handleViewProfile(candidate)}
                    >
                      <Eye className="mr-2" size={16} />
                      Profile
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
              <Search className="mx-auto mb-4 text-[#162660]/50" size={64} />
              <p className="text-[#162660] text-lg">
                No matching candidates found. Try adjusting the job
                requirements.
              </p>
            </div>
          )
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
            <Search className="mx-auto mb-4 text-[#162660]/50" size={64} />
            <p className="text-[#162660] text-lg mb-4">
              Post a job to see recommended candidates
            </p>
            <Button
              onClick={handlePostJob}
              disabled={isLoading}
              className="bg-[#162660] text-white hover:bg-[#111B4A]"
            >
              Post a Job Now
            </Button>
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

      {/* Candidate Profile Sidebar */}
      {showProfile && selectedCandidate && (
        <div className="candidate-sidebar fixed inset-y-0 right-0 w-[28rem] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 p-8 overflow-y-auto border-l border-gray-200">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-[#162660] tracking-tight">
              Candidate Profile
            </h2>
            <button
              onClick={() => setShowProfile(false)}
              className="text-gray-500 hover:text-[#162660] transition-colors p-2 rounded-full hover:bg-gray-100"
              aria-label="Close candidate profile"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          {loadingProfile ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#162660]"></div>
            </div>
          ) : profileError ? (
            <div className="bg-red-50 p-6 rounded-xl text-red-600 font-medium">
              {profileError}
            </div>
          ) : candidateDetails ? (
            <>
              <div className="flex items-center space-x-5 mb-8">
                <div className="w-16 h-16 bg-[#162660] text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-md">
                  {selectedCandidate.name?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#162035]">
                    {selectedCandidate.name || "Anonymous Candidate"}
                  </h3>
                </div>
              </div>

              <div className="mb-8">
                <div className="bg-gray-50 p-4 rounded-xl mb-4">
                  <p className="text-sm text-gray-500 mb-1">Match Score</p>
                  <p className="font-semibold text-[#162660]">
                    {Math.round(selectedCandidate.matchScore)}%
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">Experience</p>
                  <p className="font-semibold text-[#162660]">
                    {candidateDetails.experience || "Not specified"}
                  </p>
                </div>
              </div>

              {candidateDetails.skills?.length ? (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold mb-4 text-[#162660]">
                    Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {candidateDetails.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-[#162660]/10 text-[#162660] px-4 py-1.5 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {candidateDetails.summarizedText && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold mb-4 text-[#162660]">
                    Resume Summary
                  </h4>
                  <div className="bg-gray-50 p-6 rounded-xl text-gray-700 leading-relaxed border border-gray-100">
                    {candidateDetails.summarizedText}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-600 font-medium bg-gray-50 p-6 rounded-xl">
              No candidate details available.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
