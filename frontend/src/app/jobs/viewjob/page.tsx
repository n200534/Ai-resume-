"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ViewJobPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobDetailLoading, setJobDetailLoading] = useState(false);
  const [showAtsScore, setShowAtsScore] = useState(false);
  const [atsAnalysis, setAtsAnalysis] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);

  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  useEffect(() => {
    const fetchRecommendedJobs = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = getAuthToken();
        if (!token) {
          setError("You need to be logged in to view recommended jobs.");
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          "http://localhost:5001/api/jobs/recommended",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error response:", errorText);
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.recommendedJobs?.length > 0) {
          setJobs(data.recommendedJobs);
          fetchJobDetails(data.recommendedJobs[0]._id);
        } else {
          setJobs([]);
          setSelectedJob(null);
        }
      } catch (err) {
        console.error("Failed to fetch recommended jobs:", err);
        setError("Failed to load recommended jobs. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendedJobs();
  }, []);

  const fetchJobDetails = async (jobId) => {
    try {
      setJobDetailLoading(true);

      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`http://localhost:5001/api/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setSelectedJob(data.job);
      // Reset ATS score panel when changing jobs
      setShowAtsScore(false);
      setAtsAnalysis(null);
    } catch (err) {
      console.error("Failed to fetch job details:", err);
    } finally {
      setJobDetailLoading(false);
    }
  };

  const handleJobSelect = (jobId) => {
    fetchJobDetails(jobId);
  };

  const handleRemove = (id) => {
    const updatedJobs = jobs.filter((job) => job._id !== id);
    setJobs(updatedJobs);

    if (selectedJob?._id === id && updatedJobs.length > 0) {
      fetchJobDetails(updatedJobs[0]._id);
    } else if (updatedJobs.length === 0) {
      setSelectedJob(null);
    }
  };

  const handleApply = async (jobId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert("You need to be logged in to apply for jobs.");
        return;
      }

      const response = await fetch(
        `http://localhost:5001/api/jobs/${jobId}/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! Status: ${response.status}`
        );
      }

      const data = await response.json();
      alert("Application submitted successfully!");
    } catch (err) {
      console.error("Failed to apply for job:", err);
      alert(
        err.message || "Failed to apply for this job. Please try again later."
      );
    }
  };

  const fetchCurrentResume = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        "http://localhost:5001/api/resumes/current",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data.resume;
    } catch (err) {
      console.error("Failed to fetch current resume:", err);
      throw err;
    }
  };

  // In the handleAtsScoreClick function, replace the current resume fetching code with this:

  const handleAtsScoreClick = async () => {
    // Toggle the ATS score panel if already showing
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

      // Fetch the current resume
      const resumeResponse = await fetch(
        "http://localhost:5001/api/resumes/current",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!resumeResponse.ok) {
        const errorData = await resumeResponse.json();
        throw new Error(
          errorData.error || errorData.message || "Resume not found"
        );
      }

      const resumeData = await resumeResponse.json();
      console.log("Resume data:", resumeData); // Debug: Check what's being returned

      if (!resumeData.resume) {
        throw new Error("No resume found in response");
      }

      // Fixed: Use the correct resume ID from the response
      const resumeId = resumeData.resume.id;

      // Use the job description from the selected job
      const jobDescription = selectedJob.description;

      // Send ATS score request with resumeId instead of full resume
      const response = await fetch(
        "http://localhost:5001/api/resumes/ats-score",
        {
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
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze resume");
      }

      const data = await response.json();

      // Transform data to match the expected format
      const analysisData = {
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
      alert("Failed to analyze resume: " + err.message);
    } finally {
      setAtsLoading(false);
    }
  };

  const formatSalary = (salary) => {
    if (!salary) return null;

    if (typeof salary === "object") {
      const currency = salary.currency || "";
      const amount = salary.amount || "";
      return `${currency} ${amount}`;
    }

    return salary;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading recommended jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-4">
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-md flex overflow-hidden h-screen">
        <div className="w-1/3 border-r border-gray-300 p-4 overflow-y-auto h-full">
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            Top job picks for you
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Based on your resume skills and interests
          </p>
          {jobs.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No recommended jobs found. Please upload or update your resume to
              get personalized recommendations.
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  className={`bg-gray-100 p-3 rounded flex items-center justify-between hover:bg-gray-200 transition cursor-pointer ${
                    selectedJob?._id === job._id
                      ? "border-l-4 border-[#162660]"
                      : ""
                  }`}
                  onClick={() => handleJobSelect(job._id)}
                >
                  <div>
                    <div className="text-sm font-semibold capitalize">
                      {job.title}
                    </div>
                    <div className="text-xs text-gray-600">{job.company}</div>
                    <div className="text-xs text-gray-400">{job.location}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(job._id);
                    }}
                    className="text-gray-500 hover:text-black text-sm font-bold px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-2/3 p-8 overflow-y-auto h-full">
          {jobDetailLoading ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading job details...</p>
            </div>
          ) : selectedJob ? (
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
                <Button
                  className="bg-[#162660] text-white"
                  onClick={() => handleApply(selectedJob._id)}
                >
                  Apply
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAtsScoreClick}
                  disabled={atsLoading}
                >
                  {atsLoading ? "Analyzing..." : "ATS Score"}
                </Button>
              </div>

              {/* ATS Score Toggle Card */}
              {showAtsScore && atsAnalysis && (
                <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200 transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-blue-800">
                      ATS Analysis
                    </h3>
                    <button
                      onClick={() => setShowAtsScore(false)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {atsAnalysis.atsScore}/100
                        </div>
                        <div className="text-sm text-gray-500">
                          Overall ATS Score
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {atsAnalysis.keywordMatch?.matchPercentage || 0}%
                        </div>
                        <div className="text-sm text-gray-500">
                          Keyword Match
                        </div>
                        <div className="text-xs text-gray-400">
                          {atsAnalysis.keywordMatch?.matchedKeywords || 0} of{" "}
                          {atsAnalysis.keywordMatch?.totalKeywords || 0}{" "}
                          keywords found
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <div className="bg-white p-3 rounded shadow-sm">
                      <h4 className="font-semibold text-sm mb-2 text-blue-800">
                        Strengths
                      </h4>
                      <ul className="list-disc list-inside text-sm">
                        {atsAnalysis.strengths?.map((strength, index) => (
                          <li key={index} className="text-gray-700">
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white p-3 rounded shadow-sm">
                      <h4 className="font-semibold text-sm mb-2 text-amber-800">
                        Areas for Improvement
                      </h4>
                      <ul className="list-disc list-inside text-sm">
                        {atsAnalysis.improvementAreas?.map((area, index) => (
                          <li key={index} className="text-gray-700">
                            {area}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white p-3 rounded shadow-sm">
                      <h4 className="font-semibold text-sm mb-2 text-green-800">
                        Recommended Changes
                      </h4>
                      <ul className="list-disc list-inside text-sm">
                        {atsAnalysis.recommendedChanges?.map(
                          (recommendation, index) => (
                            <li key={index} className="text-gray-700">
                              {recommendation}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

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
                    <strong>Experience:</strong>{" "}
                    {selectedJob.requiredExperience} years
                  </li>
                  <li>
                    <strong>Location:</strong> {selectedJob.location}
                  </li>
                  {selectedJob.salary && (
                    <li>
                      <strong>Salary:</strong>{" "}
                      {formatSalary(selectedJob.salary)}
                    </li>
                  )}
                </ul>

                {selectedJob.skills && selectedJob.skills.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-1">Required Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <h4 className="font-semibold mb-1">Description:</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedJob.description}
                </p>

                {selectedJob.postedDate && (
                  <div className="mt-4 text-xs text-gray-500">
                    Posted:{" "}
                    {new Date(selectedJob.postedDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-sm flex justify-center items-center h-full">
              No job selected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
