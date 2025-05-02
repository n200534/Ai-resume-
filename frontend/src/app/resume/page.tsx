"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  Trash2,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [analysis, setAnalysis] = useState<{
    atsAnalysis?: {
      atsScore: number;
      keywordMatch: {
        totalKeywords: number;
        matchedKeywords: number;
        matchPercentage: number;
      };
      strengths: string[];
      improvementAreas: string[];
      recommendedChanges: string[];
    };
    analysis?: {
      skills: string[];
      experience: string;
      feedback: string;
    };
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 1) {
      alert("You can only upload one file at a time.");
      return;
    }

    const file = acceptedFiles[0];
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    setFile(file);
    // Reset any previous errors
    setError(null);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    accept: { "application/pdf": [".pdf"] },
  });

  const handleAnalyze = async () => {
    if (!file) {
      alert("Please upload a resume before analyzing.");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("resume", file);

    // Only append job description if it's not empty
    if (jobDescription.trim()) {
      formData.append("jobDescription", jobDescription);
    }
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    try {
      const response = await fetch(`${API_URL}/api/resumes/upload`, {
        method: "POST",
        body: formData,
        // If you have authentication, uncomment and adjust
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Unknown error occurred");
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (error: any) {
      console.error("Error analyzing resume:", error);
      setError(error.message || "Failed to analyze resume");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Left Side: Resume Upload & Job Description */}
        <div className="flex flex-col items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-[#162660] mb-6 flex items-center">
            <FileText className="mr-3 text-[#162660]" />
            Upload Your Resume
          </h1>

          {/* Drag & Drop Zone */}
          <div
            {...getRootProps()}
            className="w-full border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl p-8 text-center 
            hover:border-[#162660] hover:bg-gray-100 transition-all duration-300 
            flex flex-col items-center justify-center cursor-pointer group"
          >
            <input {...getInputProps()} />
            <UploadCloud className="w-12 h-12 text-gray-400 group-hover:text-[#162660] mb-4 transition" />
            <p className="text-gray-600 text-base mb-2">
              Drag & drop or{" "}
              <span className="text-[#162660] font-semibold">Browse</span>
            </p>
            <p className="text-sm text-gray-500">PDF files, max 10MB</p>
          </div>

          {/* Uploaded File Preview */}
          {file && (
            <div className="mt-4 w-full bg-white rounded-lg shadow-md p-3 flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="mr-3 text-gray-500" />
                <span className="text-gray-700 truncate max-w-[200px]">
                  {file.name}
                </span>
              </div>
              <button
                onClick={() => setFile(null)}
                className="hover:bg-red-50 rounded-full p-1 transition"
              >
                <Trash2 className="w-5 h-5 text-gray-500 hover:text-red-600" />
              </button>
            </div>
          )}

          {/* Job Description Textarea */}
          <div className="w-full mt-4">
            <label
              htmlFor="jobDescription"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Job Description (Optional)
            </label>
            <Textarea
              id="jobDescription"
              placeholder="Paste the job description here for a more detailed analysis"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full min-h-[150px] resize-y"
            />
          </div>

          {/* Analyze Button */}
          <Button
            className="mt-6 w-full bg-[#162660] text-white hover:bg-[#111B4A] 
            transition-colors duration-300 flex items-center justify-center"
            onClick={handleAnalyze}
            disabled={uploading || !file}
          >
            {uploading ? (
              <>
                <span className="mr-2">Analyzing</span>
                <div className="animate-spin">◌</div>
              </>
            ) : (
              "Analyze Resume"
            )}
          </Button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 w-full bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg">
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Right Side: Analysis Results */}
        <div className="flex flex-col">
          <h2 className="text-2xl md:text-3xl font-bold text-[#162660] mb-6 flex items-center">
            <CheckCircle2 className="mr-3 text-[#162660]" />
            Resume Analysis
          </h2>

          {analysis ? (
            <div className="bg-[#F0F4FF] p-6 rounded-xl shadow-md space-y-4">
              {/* ATS Analysis Section */}
              {analysis.atsAnalysis && (
                <>
                  <div className="flex items-center justify-between border-b pb-3 border-gray-200">
                    <span className="text-gray-700 font-semibold">
                      ATS Score
                    </span>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-[#162660] mr-2">
                        {analysis.atsAnalysis.atsScore}%
                      </span>
                      {analysis.atsAnalysis.atsScore >= 75 ? (
                        <CheckCircle2 className="text-green-500" />
                      ) : (
                        <AlertTriangle className="text-yellow-500" />
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[#162660] mb-2">
                      Keyword Matching
                    </h3>
                    <p className="text-gray-700">
                      {analysis.atsAnalysis.keywordMatch.matchedKeywords} out of{" "}
                      {analysis.atsAnalysis.keywordMatch.totalKeywords} keywords
                      matched (
                      {analysis.atsAnalysis.keywordMatch.matchPercentage}%)
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[#162660] mb-2">
                      Strengths
                    </h3>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1">
                      {analysis.atsAnalysis.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[#162660] mb-2">
                      Improvement Areas
                    </h3>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1">
                      {analysis.atsAnalysis.improvementAreas.map(
                        (area, index) => (
                          <li key={index}>{area}</li>
                        )
                      )}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-[#162660] mb-2">
                      Recommended Changes
                    </h3>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1">
                      {analysis.atsAnalysis.recommendedChanges.map(
                        (change, index) => (
                          <li key={index}>{change}</li>
                        )
                      )}
                    </ul>
                  </div>
                </>
              )}

              {/* General Resume Analysis Section */}
              {analysis.analysis && (
                <div className="mt-4 border-t pt-4 border-gray-200">
                  <h3 className="text-lg font-semibold text-[#162660] mb-2">
                    Resume Skills
                  </h3>
                  <p className="text-gray-700 mb-2">
                    {analysis.analysis.skills.join(", ")}
                  </p>

                  <h3 className="text-lg font-semibold text-[#162660] mb-2">
                    Experience Summary
                  </h3>
                  <p className="text-gray-700 mb-2">
                    {analysis.analysis.experience}
                  </p>

                  <h3 className="text-lg font-semibold text-[#162660] mb-2">
                    Feedback
                  </h3>
                  <p className="text-gray-700">{analysis.analysis.feedback}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-100 p-6 rounded-xl text-center text-gray-600">
              <FileText className="mx-auto mb-4 text-gray-400" size={48} />
              <p>Upload a resume to see the analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
