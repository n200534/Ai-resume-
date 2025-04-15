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

  // Backend URL
  const BACKEND_URL = "http://localhost:5001";

  // Get token from localStorage instead of context
  const getAuthToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  useEffect(() => {
    // Fetch jobs posted by the current user
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

        if (!response.ok) {
          throw new Error(`Failed to fetch jobs: ${response.status}`);
        }

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

    if (!token) {
      return;
    }

    try {
      setLoadingCandidates(true);
      // Updated to use BACKEND_URL
      const response = await fetch(
        `${BACKEND_URL}/api/jobs/${jobId}/applicants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch candidates: ${response.status}`);
      }

      const data = await response.json();
      setCandidates(data.applicants);
      setLoadingCandidates(false);
    } catch (err) {
      console.error("Error fetching candidates:", err);
      setLoadingCandidates(false);
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

    if (!token) {
      return;
    }

    try {
      // Updated to use BACKEND_URL
      const response = await fetch(`${BACKEND_URL}/api/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete job: ${response.status}`);
      }

      // Remove the job from state
      setJobs(jobs.filter((job) => job._id !== jobId));
      if (selectedJobIndex >= jobs.length - 1) {
        setSelectedJobIndex(Math.max(0, jobs.length - 2));
      }
    } catch (err) {
      console.error("Error deleting job:", err);
    }
  };

  // Helper function to format salary object
  const formatSalary = (salary) => {
    if (!salary) return "Not specified";

    // If salary is a string, return it directly
    if (typeof salary === "string") return salary;

    // If salary is an object with min, max, and currency properties
    if (salary.min && salary.max && salary.currency) {
      return `${salary.currency}${salary.min} - ${salary.currency}${salary.max}`;
    }

    // Fallback: convert the object to a string representation
    return JSON.stringify(salary);
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading your jobs...
      </div>
    );
  if (error)
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  if (jobs.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center flex-col">
        <h2 className="text-xl font-semibold mb-4">
          You haven't posted any jobs yet
        </h2>
        <a
          href="/post-job"
          className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800"
        >
          Post Your First Job
        </a>
      </div>
    );
  }

  const selectedJob = jobs[selectedJobIndex];

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-1/3 p-6 border-r overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Jobs Posted by you</h2>
        <div className="space-y-3">
          {jobs.map((job, index) => (
            <div
              key={job._id}
              onClick={() => setSelectedJobIndex(index)}
              className={`bg-white p-4 rounded-xl shadow-sm cursor-pointer flex items-center justify-between transition border ${
                selectedJobIndex === index
                  ? "border-blue-600 bg-gray-100"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full border flex items-center justify-center text-lg font-bold">
                  {job.company.charAt(0)}
                </div>
                <div>
                  <h4 className="font-medium text-sm">{job.title}</h4>
                  <p className="text-xs text-gray-600">{job.company}</p>
                  <p className="text-xs text-gray-500">{job.location}</p>
                </div>
              </div>
              <button
                className="text-gray-500 hover:text-black text-lg font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteJob(job._id);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Job Details */}
      <div className="w-2/3 p-10 overflow-y-auto">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold">
            {selectedJob?.company?.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{selectedJob?.company}</h2>
            <h1 className="text-2xl font-bold">{selectedJob?.title}</h1>
            <p className="text-sm text-gray-600">{selectedJob?.location}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          {selectedJob?.applicants?.length || 0} candidates applied
        </p>
        <button
          className="bg-blue-700 text-white px-4 py-2 mt-2 rounded-md hover:bg-blue-800 text-sm"
          onClick={handleViewCandidates}
        >
          {showCandidates ? "Hide Candidates" : "View Candidates"}
        </button>

        {/* Candidates Toggle Card */}
        {showCandidates && (
          <div className="mt-4 bg-white p-4 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-3">Applicants</h3>
            {loadingCandidates ? (
              <p>Loading candidates...</p>
            ) : candidates.length > 0 ? (
              <div className="space-y-3">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.userId}
                    className="border rounded-lg p-3 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">
                          {candidate.user?.name || "Anonymous Candidate"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {candidate.user?.email || ""}
                        </p>
                      </div>
                      <div>
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {Math.round(candidate.matchScore)}% Match
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <a
                        href={`/candidates/${candidate.userId}`}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        View Profile
                      </a>
                      <a
                        href={`${BACKEND_URL}/resumes/${candidate.resumeId}`}
                        className="text-blue-600 text-sm hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Resume
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No candidates have applied to this job yet.</p>
            )}
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-xl font-bold mb-2">About the Job</h3>
          <div className="text-sm text-gray-800 leading-relaxed">
            <p>
              <strong>Job Title</strong>: {selectedJob?.title}
            </p>
            <p>
              <strong>Employment Type</strong>: {selectedJob?.employmentType}
            </p>
            <p>
              <strong>Experience</strong>: {selectedJob?.requiredExperience}+
              years
            </p>
            <p>
              <strong>Location</strong>: {selectedJob?.location}
            </p>
            <p className="mt-3">
              <strong>Description:</strong>
            </p>
            <p>{selectedJob?.description}</p>

            {selectedJob?.skills && selectedJob.skills.length > 0 && (
              <>
                <p className="mt-3">
                  <strong>Required Skills:</strong>
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedJob.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 px-2 py-1 rounded text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </>
            )}

            {selectedJob?.salary && (
              <p className="mt-3">
                <strong>Salary Range:</strong>{" "}
                {formatSalary(selectedJob.salary)}
              </p>
            )}

            <p className="mt-3">
              <strong>Posted:</strong>{" "}
              {new Date(selectedJob?.postedDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
