"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JobsPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<{
    skills: string[];
    experience: string;
    aiFeedback: string;
  } | null>(null);

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

    setFiles([file]); // Only store one file
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    accept: { "application/pdf": [".pdf"] },
  });

  const handleAnalyze = async () => {
    if (files.length === 0) {
      alert("Please upload a resume before analyzing.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", files[0]);
    formData.append("name", "John Doe"); // Replace with actual user data
    formData.append("email", "johndoe@example.com"); // Replace with actual user data

    setUploading(true);

    try {
      const response = await fetch("http://localhost:5001/api/resumes/upload", {
        method: "POST",
        body: formData,
        credentials: "include", // Ensures authentication details are sent
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // If using JWT
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.error || "Unknown error");
      }

      const data = await response.json();
      console.log("Resume Analysis:", data);
    } catch (error) {
      console.error("Error analyzing resume:", error);
    }
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
          Drag and drop your files here or{" "}
          <span className="text-[#162660] font-semibold">Browse</span>
        </p>
        <p className="text-sm text-gray-500">Max 10MB files are allowed</p>
      </div>

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
          onClick={() => setFiles([])}
        >
          Cancel
        </Button>
        <Button
          className="bg-[#162660] text-white hover:bg-[#111B4A]"
          onClick={handleAnalyze}
          disabled={uploading}
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
          <p className="text-gray-700">
            <strong>AI Feedback:</strong> {analysis.aiFeedback}
          </p>
          <p className="text-gray-700">
            <strong>Experience:</strong> {analysis.experience}
          </p>
          <p className="text-gray-700">
            <strong>Skills:</strong> {analysis.skills.join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
