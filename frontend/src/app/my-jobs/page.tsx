"use client";

import { useState, useEffect } from "react";

export default function MyJobsPage() {
  const [selectedJobIndex, setSelectedJobIndex] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCandidates, setShowCandidates] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [candidateDetails, setCandidateDetails] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);

  const BACKEND_URL = "http://localhost:5001";

  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  useEffect(() => {
    const fetchMyJobs = async () => {
      const token = getAuthToken();
      if (!token) {
        setError("Authentication required. Please log in.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/jobs/my-jobs`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok)
          throw new Error(`Failed to fetch jobs: ${response.status}`);
        const data = await response.json();
        setJobs(data.jobs);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("Failed to load your jobs. Please try again.");
        setLoading(false);
      }
    };
    fetchMyJobs();
  }, []);

  const fetchCandidates = async (jobId) => {
    const token = getAuthToken();
    if (!token) return;
    try {
      setLoadingCandidates(true);
      const response = await fetch(
        `${BACKEND_URL}/api/jobs/${jobId}/applicants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok)
        throw new Error(`Failed to fetch candidates: ${response.status}`);
      const data = await response.json();
      console.log("Fetched candidates:", data.applicants); // Debug log
      setCandidates(data.applicants);
      setLoadingCandidates(false);
    } catch (err) {
      console.error("Error fetching candidates:", err);
      setLoadingCandidates(false);
    }
  };

// Updated fetchCandidateDetails function
const fetchCandidateDetails = async (userId) => {
  console.log("Fetching details for userId:", userId);
  const token = getAuthToken();
  if (!token) {
    console.error("No auth token found");
    setProfileError("Authentication required. Please log in.");
    return;
  }
  if (!userId || typeof userId !== "string") {
    console.error("Invalid userId:", userId);
    setProfileError("Invalid user ID.");
    setLoadingProfile(false);
    return;
  }
  try {
    setLoadingProfile(true);
    setProfileError(null);
    // Change the endpoint to fetch a specific user's resume instead of current
    const response = await fetch(`${BACKEND_URL}/api/resumes/user-resume/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Fetch error response:", errorData);
      throw new Error(`Failed to fetch resume: ${response.status}`);
    }
    const data = await response.json();
    setCandidateDetails(data.resume);
    setLoadingProfile(false);
  } catch (err) {
    console.error("Error fetching candidate details:", err);
    setProfileError("Failed to load candidate details. Please try again.");
    setLoadingProfile(false);
  }
};

  const handleViewCandidates = () => {
    if (jobs.length > 0) {
      const jobId = jobs[selectedJobIndex]._id;
      fetchCandidates(jobId);
      setShowCandidates(!showCandidates);
    }
  };

  const handleDeleteJob = async (jobId) => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok)
        throw new Error(`Failed to delete job: ${response.status}`);
      setJobs(jobs.filter((job) => job._id !== jobId));
      setSelectedJobIndex(Math.max(0, jobs.length - 2));
    } catch (err) {
      console.error("Error deleting job:", err);
    }
  };

  const formatSalary = (salary) => {
    if (!salary) return "Not specified";
    if (typeof salary === "string") return salary;
    if (salary.min && salary.max && salary.currency) {
      return `${salary.currency}${salary.min} - ${salary.currency}${salary.max}`;
    }
    return JSON.stringify(salary);
  };

  const handleViewProfile = (candidate) => {
    console.log("Viewing profile for candidate:", candidate); // Debug log
    if (!candidate.userId) {
      console.error("No userId for candidate:", candidate);
      setProfileError("No user information available for this candidate.");
      setSelectedCandidate(candidate);
      setShowProfile(true);
      return;
    }
    setSelectedCandidate(candidate);
    setShowProfile(true);
    fetchCandidateDetails(candidate.userId);
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 text-[#162660]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#162660] mb-3"></div>
          <p className="font-medium">Loading your jobs...</p>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md border-l-4 border-red-500 max-w-md">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-700">{error}</p>
          <button
            className="mt-4 bg-[#162660] text-white px-4 py-2 rounded hover:bg-[#162035] transition-colors"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  if (jobs.length === 0)
    return (
      <div className="h-screen flex items-center justify-center flex-col bg-gray-50">
        <div className="bg-white p-10 rounded-xl shadow-md max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#162660] text-white flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-3 text-[#162660]">
            You haven't posted any jobs yet
          </h2>
          <p className="text-gray-600 mb-6">
            Create your first job posting to start finding the perfect
            candidates.
          </p>
          <a
            href="/post-job"
            className="bg-[#162660] text-white px-6 py-3 rounded-md hover:bg-[#162035] transition-colors inline-block font-medium"
          >
            Post Your First Job
          </a>
        </div>
      </div>
    );

  const selectedJob = jobs[selectedJobIndex];

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-gray-50">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-200 bg-white shadow-sm overflow-y-auto">
        <div className="p-6 border-b border-gray-200 bg-[#162660] text-white">
          <h2 className="text-xl font-semibold">My Job Postings</h2>
          <p className="text-sm opacity-80 mt-1">
            Manage your active job listings
          </p>
        </div>
        <div className="py-4 px-4">
          {jobs.map((job, index) => (
            <div
              key={job._id}
              onClick={() => setSelectedJobIndex(index)}
              className={`p-4 rounded-lg cursor-pointer mb-3 transition border ${
                selectedJobIndex === index
                  ? "border-[#162660] bg-[#162660]/5"
                  : "border-gray-200 hover:border-[#162660]/30 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                      selectedJobIndex === index
                        ? "bg-[#162660] text-white"
                        : "bg-[#162660]/10 text-[#162660]"
                    }`}
                  >
                    {job.company.charAt(0)}
                  </div>
                  <div>
                    <h4
                      className={`font-medium ${
                        selectedJobIndex === index
                          ? "text-[#162660]"
                          : "text-gray-800"
                      }`}
                    >
                      {job.title}
                    </h4>
                    <p className="text-sm text-gray-600">{job.company}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-3 h-3 mr-1"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                        />
                      </svg>
                      {job.location}
                    </div>
                  </div>
                </div>
                <button
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      confirm(
                        "Are you sure you want to delete this job posting?"
                      )
                    )
                      handleDeleteJob(job._id);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>
              </div>
              <div className="mt-2 flex items-center text-xs">
                <span className="bg-[#162660]/10 text-[#162660] px-2 py-1 rounded-full">
                  {job.employmentType}
                </span>
                <span className="ml-2 text-gray-500">
                  {job.applicants?.length || 0} applicants
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200">
          <a
            href="/post-job"
            className="flex items-center justify-center bg-[#162660]/10 text-[#162660] py-2 rounded-md hover:bg-[#162660]/20 transition-colors w-full font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Post New Job
          </a>
        </div>
      </div>

      {/* Job Details and Candidates */}
      <div className="w-2/3 overflow-y-auto relative">
        <div className="p-8 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-[#162660] text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-md">
              {selectedJob?.company?.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-medium text-[#162035]">
                {selectedJob?.company}
              </h2>
              <h1 className="text-2xl font-bold text-[#162660]">
                {selectedJob?.title}
              </h1>
              <div className="flex items-center mt-1 text-sm text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 mr-1"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
                {selectedJob?.location}
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center">
            <span className="px-4 py-1 bg-[#162660]/10 text-[#162660] border border-[#162660]/20 rounded-full text-sm font-medium">
              {selectedJob?.applicants?.length || 0} candidates applied
            </span>
            <button
              className="ml-3 bg-[#162660] hover:bg-[#162035] text-white px-4 py-1 rounded-full transition-colors text-sm font-medium flex items-center shadow-sm"
              onClick={handleViewCandidates}
            >
              {showCandidates ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 mr-1"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                  Hide Candidates
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 mr-1"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                  View Candidates
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-8">
          {showCandidates && (
            <div className="mb-8 bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#162660]">
                  Applicants
                </h3>
                <span className="bg-[#162660]/10 text-[#162660] px-3 py-1 rounded-full text-sm font-medium">
                  {candidates.length} total
                </span>
              </div>
              {loadingCandidates ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#162660]"></div>
                </div>
              ) : candidates.length > 0 ? (
                <div className="space-y-3">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.userId}
                      className="border border-gray-200 rounded-lg p-4 hover:border-[#162660]/30 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-[#162660]/10 rounded-full flex items-center justify-center text-[#162660] font-semibold mr-3">
                            {(candidate.user?.name || "A").charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">
                              {candidate.user?.name || "Anonymous Candidate"}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {candidate.user?.email || ""}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span
                            className={`text-xs font-medium px-3 py-1 rounded-full ${
                              candidate.matchScore >= 75
                                ? "bg-green-100 text-green-800"
                                : candidate.matchScore >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {Math.round(candidate.matchScore)}% Match
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-3">
                        <a
                          href={`/candidates/${candidate.userId}`}
                          className="text-[#162660] text-sm hover:underline font-medium flex items-center"
                          onClick={(e) => {
                            e.preventDefault();
                            handleViewProfile(candidate);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 mr-1"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                            />
                          </svg>
                          View Profile
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-600 bg-gray-50 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-12 h-12 mx-auto text-gray-400 mb-3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                  <p>No candidates have applied to this job yet.</p>
                </div>
              )}
            </div>
          )}

          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold mb-4 text-[#162660]">
              Job Details
            </h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Employment Type</p>
                <p className="font-medium">{selectedJob?.employmentType}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">
                  Experience Required
                </p>
                <p className="font-medium">
                  {selectedJob?.requiredExperience}+ years
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Location</p>
                <p className="font-medium">{selectedJob?.location}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Salary Range</p>
                <p className="font-medium">
                  {formatSalary(selectedJob?.salary)}
                </p>
              </div>
            </div>
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3 text-[#162660]">
                Description
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed">
                {selectedJob?.description}
              </div>
            </div>
            {selectedJob?.skills && selectedJob.skills.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-[#162660]">
                  Required Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-[#162660]/10 text-[#162660] px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
              <p>
                <span className="font-medium">Posted:</span>{" "}
                {new Date(selectedJob?.postedDate).toLocaleDateString()}
              </p>
              <div className="flex space-x-2">
                <a
                  href={`/edit-job/${selectedJob?._id}`}
                  className="text-[#162660] hover:underline flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 mr-1"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                  Edit Job
                </a>
                <button
                  className="text-red-500 hover:underline flex items-center"
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to delete this job posting?"
                      )
                    )
                      handleDeleteJob(selectedJob?._id);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 mr-1"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                  Delete Job
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Profile Sidebar */}
        {showProfile && selectedCandidate && (
          <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#162660]">
                Candidate Profile
              </h2>
              <button
                onClick={() => setShowProfile(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24  FS24"
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
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#162660]"></div>
              </div>
            ) : profileError ? (
              <div className="bg-red-50 p-4 rounded-lg text-red-600">
                {profileError}
              </div>
            ) : candidateDetails ? (
              <>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-[#162660] text-white rounded-full flex items-center justify-center text-2xl font-bold">
                    {selectedCandidate.user?.name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#162035]">
                      {selectedCandidate.user?.name || "Anonymous Candidate"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedCandidate.user?.email || "No email"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Match Score</p>
                    <p className="font-medium">
                      {Math.round(selectedCandidate.matchScore)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Experience</p>
                    <p className="font-medium">
                      {candidateDetails.experience || "Not specified"}
                    </p>
                  </div>
                </div>

                {candidateDetails.skills?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3 text-[#162660]">
                      Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {candidateDetails.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-[#162660]/10 text-[#162660] px-3 py-1 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-3 text-[#162660]">
                    Resume
                  </h4>
                  {candidateDetails ? (
                    <a
                      href={`${BACKEND_URL}/api/resumes/current`}
                      className="text-[#162660] hover:underline flex items-center"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4 mr-1"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0-1.125-.504-1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                      {candidateDetails.fileName || "View Latest Resume"}
                    </a>
                  ) : (
                    <p className="text-gray-600">No resume available.</p>
                  )}
                </div>

                {candidateDetails.feedback && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3 text-[#162660]">
                      Resume Feedback
                    </h4>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {candidateDetails.feedback}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-600">
                No candidate details available.
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-2">
              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={() => setShowProfile(false)}
              >
                Close
              </button>
              <button className="bg-[#162660] text-white px-4 py-2 rounded-lg hover:bg-[#162035] transition-colors">
                Schedule Call
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
