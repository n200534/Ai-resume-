"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Update interface to match new API response
interface ResumeAnalysis {
  skills: string[];
  experience: string;
  feedback: string;
}

export default function JobsPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    // Validate file upload
    if (acceptedFiles.length > 1) {
      setError("You can only upload one file at a time.");
      return;
    }

    const file = acceptedFiles[0];

    // Validate file type and size
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    setFiles([file]);
    setError(null);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    accept: { "application/pdf": [".pdf"] },
  });

  const handleAnalyze = async () => {
    // Validate file upload before analysis
    if (files.length === 0) {
      setError("Please upload a resume before analyzing.");
      return;
    }

    // Prepare form data for upload
    const formData = new FormData();
    formData.append("resume", files[0]);

    setUploading(true);
    setError(null);

    try {
      // Retrieve token from local storage (ensure you have authentication)
      const token = localStorage.getItem("token");

      // Make API call to upload and analyze resume
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/resumes/upload`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token || ""}`,
          },
        }
      );

      // Handle API response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Unknown error occurred during resume analysis"
        );
      }

      const data = await response.json();
      console.log("Resume Analysis:", data);

      // Update analysis state with returned data
      setAnalysis({
        skills: data.analysis?.skills || [],
        experience: data.analysis?.experience || "No experience details found",
        feedback: data.analysis?.feedback || "Resume analysis completed",
      });
    } catch (error) {
      console.error("Error analyzing resume:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during resume analysis"
      );
    } finally {
      setUploading(false);
    }
  };

  // Reset all states
  const handleReset = () => {
    setFiles([]);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      {/* Title */}
      <h1 className="text-4xl font-bold text-[#162660] mb-8 text-center">
        Upload Your Resume and Let AI Do the Magic for You
      </h1>

      {/* Drag & Drop Box */}
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-400 bg-white rounded-lg w-full max-w-2xl h-56 p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#162660] transition"
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-12 h-12 text-gray-500 mb-3" />
        <p className="text-gray-600 text-lg">
          Drag and drop your PDF files here or{" "}
          <span className="text-[#162660] font-semibold">Browse</span>
        </p>
        <p className="text-sm text-gray-500">Max 10MB PDF files are allowed</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 w-full max-w-2xl bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Uploaded File */}
      {files.length > 0 && (
        <div className="mt-4 p-3 w-full max-w-2xl bg-white rounded-lg shadow-md flex items-center justify-between">
          <span className="text-gray-700">{files[0].name}</span>
          <button onClick={() => setFiles([])}>
            <Trash2 className="w-5 h-5 text-gray-500 hover:text-red-600" />
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex gap-4">
        <Button
          variant="outline"
          className="text-[#162660] border-[#162660]"
          onClick={handleReset}
        >
          Cancel
        </Button>
        <Button
          className="bg-[#162660] text-white hover:bg-[#111B4A]"
          onClick={handleAnalyze}
          disabled={uploading || files.length === 0}
        >
          {uploading ? "Analyzing..." : "Analyze"}
        </Button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="mt-8 p-6 w-full max-w-2xl bg-[#F0F4FF] rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-[#162660] mb-3">
            Analysis Results
          </h2>
          <p className="text-gray-700 mb-2">
            <strong>AI Feedback:</strong> {analysis.feedback}
          </p>
          <p className="text-gray-700 mb-2">
            <strong>Experience:</strong> {analysis.experience}
          </p>
          <p className="text-gray-700">
            <strong>Skills:</strong>{" "}
            {analysis.skills.join(", ") || "No skills detected"}
          </p>
        </div>
      )}
    </div>
  );
}
