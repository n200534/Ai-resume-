"use client";

import React, { useState, useEffect } from "react";

// Define interfaces for data structures
interface Salary {
  min?: number;
  max?: number;
  currency?: string;
}

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  description: string;
  requiredExperience?: number;
  salary?: Salary | string;
  skills?: string[];
  postedDate: string;
}

interface AtsAnalysis {
  atsScore: number;
  keywordMatch: {
    totalKeywords: number;
    matchedKeywords: number;
    matchPercentage: number;
  };
  strengths: string[];
  improvementAreas: string[];
  recommendedChanges: string[];
}

interface ApplicationStatus {
  [jobId: string]: boolean;
}

interface Resume {
  id: string;
}

interface ResumeResponse {
  resume: Resume;
}

interface JobResponse {
  job: Job;
}

interface RecommendedJobsResponse {
  recommendedJobs: Job[];
}

interface ApplicationStatusResponse {
  applications: { jobId: string }[];
}

export default function ViewJobPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [jobDetailLoading, setJobDetailLoading] = useState<boolean>(false);
  const [showAtsScore, setShowAtsScore] = useState<boolean>(false);
  const [atsAnalysis, setAtsAnalysis] = useState<AtsAnalysis | null>(null);
  const [atsLoading, setAtsLoading] = useState<boolean>(false);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>(
    {}
  );

  const getAuthToken = (): string | null => {
    return localStorage.getItem("token");
  };
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const passedJobData = localStorage.getItem("selectedJobData");
        let initialSelectedJob: Job | null = null;

        if (passedJobData) {
          try {
            initialSelectedJob = JSON.parse(passedJobData) as Job;
            setSelectedJob(initialSelectedJob);
            localStorage.removeItem("selectedJobData");
          } catch (e) {
            console.error("Error parsing passed job data:", e);
          }
        }

        await fetchRecommendedJobs();

        if (!initialSelectedJob && jobs.length > 0) {
          fetchJobDetails(jobs[0]._id);
        }
      } catch (err) {
        console.error("Failed to initialize view job page:", err);
        setError("Failed to load job data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []); // Note: `jobs` dependency removed as `fetchRecommendedJobs` sets `jobs`

  const fetchApplicationStatus = async (): Promise<void> => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/jobs/applications/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = (await response.json()) as ApplicationStatusResponse;

      const statusMap: ApplicationStatus = {};
      if (data.applications && Array.isArray(data.applications)) {
        data.applications.forEach((app) => {
          statusMap[app.jobId] = true;
        });
      }

      setApplicationStatus(statusMap);
    } catch (err) {
      console.error("Failed to fetch application status:", err);
    }
  };

  const fetchRecommendedJobs = async (): Promise<void> => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError("You need to be logged in to view recommended jobs.");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/jobs/recommended`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = (await response.json()) as RecommendedJobsResponse;

      if (data.recommendedJobs?.length > 0) {
        setJobs(data.recommendedJobs);
        await fetchApplicationStatus();
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.error("Failed to fetch recommended jobs:", err);
      throw err;
    }
  };

  const fetchJobDetails = async (jobId: string): Promise<void> => {
    try {
      setJobDetailLoading(true);

      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_URL}/api/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = (await response.json()) as JobResponse;
      setSelectedJob(data.job);
      setShowAtsScore(false);
      setAtsAnalysis(null);
    } catch (err) {
      console.error("Failed to fetch job details:", err);
    } finally {
      setJobDetailLoading(false);
    }
  };

  const handleJobSelect = (jobId: string): void => {
    fetchJobDetails(jobId);
  };

  const handleRemove = (id: string): void => {
    const updatedJobs = jobs.filter((job) => job._id !== id);
    setJobs(updatedJobs);

    if (selectedJob?._id === id && updatedJobs.length > 0) {
      fetchJobDetails(updatedJobs[0]._id);
    } else if (updatedJobs.length === 0) {
      setSelectedJob(null);
    }
  };

  const handleApply = async (jobId: string): Promise<void> => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert("You need to be logged in to apply for jobs.");
        return;
      }

      const response = await fetch(`${API_URL}/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! Status: ${response.status}`
        );
      }

      const data = await response.json();
      alert("Application submitted successfully!");
      setApplicationStatus((prev) => ({
        ...prev,
        [jobId]: true,
      }));
    } catch (err) {
      console.error("Failed to apply for job:", err);
      alert(
        (err as Error).message ||
          "Failed to apply for this job. Please try again later."
      );
    }
  };

  const fetchCurrentResume = async (): Promise<Resume> => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_URL}/api/resumes/current`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = (await response.json()) as ResumeResponse;
      return data.resume;
    } catch (err) {
      console.error("Failed to fetch current resume:", err);
      throw err;
    }
  };

  const handleAtsScoreClick = async (): Promise<void> => {
    if (showAtsScore && atsAnalysis) {
      setShowAtsScore(!showAtsScore);
      return;
    }

    if (!selectedJob) {
      alert("Please select a job first to analyze ATS score.");
      return;
    }

    try {
      setAtsLoading(true);
      const token = getAuthToken();

      const resumeResponse = await fetch(`${API_URL}/api/resumes/current`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!resumeResponse.ok) {
        const errorData = await resumeResponse.json();
        throw new Error(
          errorData.error || errorData.message || "Resume not found"
        );
      }

      const resumeData = (await resumeResponse.json()) as ResumeResponse;
      if (!resumeData.resume) {
        throw new Error("No resume found in response");
      }

      const resumeId = resumeData.resume.id;
      const jobDescription = selectedJob.description;

      const response = await fetch(`${API_URL}/api/resumes/ats-score`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeId: resumeId,
          jobDescription: jobDescription,
          jobId: selectedJob._id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze resume");
      }

      const data = await response.json();

      const analysisData: AtsAnalysis = {
        atsScore: data.atsAnalysis.atsScore || 50,
        keywordMatch: {
          totalKeywords: data.atsAnalysis.keywordMatch?.totalKeywords || 0,
          matchedKeywords: data.atsAnalysis.keywordMatch?.matchedKeywords || 0,
          matchPercentage: data.atsAnalysis.keywordMatch?.matchPercentage || 0,
        },
        strengths: data.atsAnalysis.strengths || [],
        improvementAreas: data.atsAnalysis.improvementAreas || [],
        recommendedChanges: data.atsAnalysis.recommendedChanges || [],
      };

      setAtsAnalysis(analysisData);
      setShowAtsScore(true);
    } catch (err) {
      console.error("Failed to get ATS score:", err);
      alert("Failed to analyze resume: " + (err as Error).message);
    } finally {
      setAtsLoading(false);
    }
  };

  const hasApplied = (jobId: string): boolean => {
    return applicationStatus[jobId] === true;
  };

  const formatSalary = (salary?: Salary | string): string => {
    if (!salary) return "Not specified";

    if (typeof salary === "string") return salary;

    if (salary.min && salary.max && salary.currency) {
      return `${salary.currency}${salary.min} - ${salary.currency}${salary.max}`;
    }

    return JSON.stringify(salary);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 text-[#162660]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#162660] mb-3"></div>
          <p className="font-medium">Loading recommended jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-gray-50">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-200 bg-white shadow-sm overflow-y-auto">
        <div className="p-6 border-b border-gray-200 bg-[#162660] text-white">
          <h2 className="text-xl font-semibold">Recommended Jobs</h2>
          <p className="text-sm opacity-80 mt-1">
            Based on your resume skills and interests
          </p>
        </div>

        <div className="py-4 px-4">
          {jobs.length === 0 ? (
            <div className="bg-white p-10 rounded-xl shadow-md text-center">
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
                No recommended jobs found
              </h2>
              <p className="text-gray-600 mb-6">
                Upload or update your resume to get personalized
                recommendations.
              </p>
              <a
                href="/upload-resume"
                className="bg-[#162660] text-white px-6 py-3 rounded-md hover:bg-[#162035] transition-colors inline-block font-medium"
              >
                Upload Resume
              </a>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job._id}
                onClick={() => handleJobSelect(job._id)}
                className={`p-4 rounded-lg cursor-pointer mb-3 transition border ${
                  selectedJob?._id === job._id
                    ? "border-[#162660] bg-[#162660]/5"
                    : "border-gray-200 hover:border-[#162660]/30 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                        selectedJob?._id === job._id
                          ? "bg-[#162660] text-white"
                          : "bg-[#162660]/10 text-[#162660]"
                      }`}
                    >
                      {job.company.charAt(0)}
                    </div>
                    <div>
                      <h4
                        className={`font-medium ${
                          selectedJob?._id === job._id
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(job._id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
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
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Job Details */}
      <div className="w-2/3 overflow-y-auto">
        {jobDetailLoading ? (
          <div className="h-full flex items-center justify-center bg-gray-50 text-[#162660]">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#162660] mb-3"></div>
              <p className="font-medium">Loading job details...</p>
            </div>
          </div>
        ) : selectedJob ? (
          <>
            <div className="p-8 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-[#162660] text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-md">
                  {selectedJob.company.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-medium text-[#162035]">
                    {selectedJob.company}
                  </h2>
                  <h1 className="text-2xl font-bold text-[#162660]">
                    {selectedJob.title}
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
                    {selectedJob.location}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                {hasApplied(selectedJob._id) ? (
                  <button
                    className="bg-gray-300 text-gray-600 px-4 py-2 rounded-md font-medium flex items-center shadow-sm cursor-not-allowed"
                    disabled
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
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Applied
                  </button>
                ) : (
                  <button
                    className="bg-[#162660] hover:bg-[#162035] text-white px-4 py-2 rounded-md transition-colors font-medium flex items-center shadow-sm"
                    onClick={() => handleApply(selectedJob._id)}
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
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Apply
                  </button>
                )}
                <button
                  className={`${
                    atsLoading
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-[#162660]/10 text-[#162660] hover:bg-[#162660]/20 border-[#162660]/20"
                  } border px-4 py-2 rounded-md transition-colors font font-medium flex items-center shadow-sm`}
                  onClick={handleAtsScoreClick}
                  disabled={atsLoading}
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
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                    />
                  </svg>
                  {atsLoading ? "Analyzing..." : "ATS Score"}
                </button>
              </div>
            </div>

            <div className="p-8">
              {showAtsScore && atsAnalysis && (
                <div className="mb-8 bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#162660]">
                      ATS Analysis
                    </h3>
                    <button
                      onClick={() => setShowAtsScore(false)}
                      className="text-gray-400 hover:text-red-500"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-center">
                        <div
                          className={`text-3xl font-bold ${
                            atsAnalysis.atsScore >= 75
                              ? "text-green-600"
                              : atsAnalysis.atsScore >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {atsAnalysis.atsScore}/100
                        </div>
                        <div className="text-sm text-gray-600">
                          Overall ATS Score
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-center">
                        <div
                          className={`text-3xl font-bold ${
                            atsAnalysis.keywordMatch.matchPercentage >= 75
                              ? "text-green-600"
                              : atsAnalysis.keywordMatch.matchPercentage >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {atsAnalysis.keywordMatch.matchPercentage}%
                        </div>
                        <div className="text-sm text-gray-600">
                          Keyword Match
                        </div>
                        <div className="text-xs text-gray-500">
                          {atsAnalysis.keywordMatch.matchedKeywords} of{" "}
                          {atsAnalysis.keywordMatch.totalKeywords} keywords
                          found
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2 text-[#162660]">
                        Strengths
                      </h4>
                      <ul className="list-disc list-inside text-sm text-gray-700">
                        {atsAnalysis.strengths?.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2 text-[#162660]">
                        Areas for Improvement
                      </h4>
                      <ul className="list-disc list-inside text-sm text-gray-700">
                        {atsAnalysis.improvementAreas?.map((area, index) => (
                          <li key={index}>{area}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2 text-[#162660]">
                        Recommended Changes
                      </h4>
                      <ul className="list-disc list-inside text-sm text-gray-700">
                        {atsAnalysis.recommendedChanges?.map(
                          (recommendation, index) => (
                            <li key={index}>{recommendation}</li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold mb-4 text-[#162660]">
                  Job Details
                </h3>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">
                      Employment Type
                    </p>
                    <p className="font-medium">{selectedJob.employmentType}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">
                      Experience Required
                    </p>
                    <p className="font-medium">
                      {selectedJob.requiredExperience ?? 0} years
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <p className="font-medium">{selectedJob.location}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Salary Range</p>
                    <p className="font-medium">
                      {formatSalary(selectedJob.salary)}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-3 text-[#162660]">
                    Description
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg text-gray-700 leading-relaxed">
                    {selectedJob.description}
                  </div>
                </div>

                {selectedJob.skills && selectedJob.skills.length > 0 && (
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

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Posted:</span>{" "}
                    {new Date(selectedJob.postedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
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
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-3 text-[#162660]">
                No job selected
              </h2>
              <p className="text-gray-600 mb-6">
                Select a job from the list to view details.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
