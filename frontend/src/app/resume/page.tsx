// "use client";

// import { useState } from "react";
// import { useDropzone } from "react-dropzone";
// import { UploadCloud, Trash2 } from "lucide-react";
// import { Button } from "@/components/ui/button";

// export default function ResumePage() {
//   const [file, setFile] = useState<File | null>(null);
//   const [analysis, setAnalysis] = useState<{
//     score: number;
//     lackingAreas: string[];
//     improvements: string;
//     recommendedJobs: string[];
//   } | null>(null);
//   const [uploading, setUploading] = useState(false);

//   const onDrop = (acceptedFiles: File[]) => {
//     if (acceptedFiles.length > 1) {
//       alert("You can only upload one file at a time.");
//       return;
//     }

//     const file = acceptedFiles[0];
//     if (file.size > 10 * 1024 * 1024) {
//       alert("File size exceeds 10MB limit.");
//       return;
//     }

//     setFile(file);
//   };

//   const { getRootProps, getInputProps } = useDropzone({
//     onDrop,
//     multiple: false,
//     maxSize: 10 * 1024 * 1024,
//     accept: { "application/pdf": [".pdf"] },
//   });

//   const handleAnalyze = async () => {
//     if (!file) {
//       alert("Please upload a resume before analyzing.");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("resume", file);

//     setUploading(true);

//     try {
//       const response = await fetch(
//         "http://localhost:5001/api/resumes/analyze",
//         {
//           method: "POST",
//           body: formData,
//           credentials: "include",
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Unknown error");
//       }

//       const data = await response.json();
//       setAnalysis(data);
//     } catch (error) {
//       console.error("Error analyzing resume:", error);
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col md:flex-row items-start justify-center min-h-screen px-4 py-8">
//       {/* Left Side: Resume Upload & Preview */}
//       <div className="w-full md:w-1/2 flex flex-col items-center">
//         <h1 className="text-3xl font-bold text-[#162660] mb-4">
//           Upload Your Resume
//         </h1>

//         {/* Drag & Drop Zone */}
//         <div
//           {...getRootProps()}
//           className="border-2 border-dashed border-gray-400 bg-white rounded-lg w-full max-w-lg h-100 p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#162660] transition"
//         >
//           <input {...getInputProps()} />
//           <UploadCloud className="w-12 h-12 text-gray-500 mb-3" />
//           <p className="text-gray-600 text-lg">
//             Drag & drop or{" "}
//             <span className="text-[#162660] font-semibold">Browse</span>
//           </p>
//           <p className="text-sm text-gray-500">Max 10MB PDF files</p>
//         </div>

//         {/* Uploaded File Preview */}
//         {file && (
//           <div className="mt-4 w-full max-w-lg bg-white rounded-lg shadow-md p-3 flex items-center justify-between">
//             <span className="text-gray-700">{file.name}</span>
//             <button onClick={() => setFile(null)}>
//               <Trash2 className="w-5 h-5 text-gray-500 hover:text-red-600" />
//             </button>
//           </div>
//         )}

//         {/* Analyze Button */}
//         <Button
//           className="mt-4 bg-[#162660] text-white hover:bg-[#111B4A]"
//           onClick={handleAnalyze}
//           disabled={uploading}
//         >
//           {uploading ? "Analyzing..." : "Analyze Resume"}
//         </Button>
//       </div>

//       {/* Middle Separator */}
//       <div className="hidden md:block w-1  h-screen mx-8 border-2 border-dashed" />

//       {/* Right Side: Analysis Results */}
//       <div className="w-full md:w-1/2 flex flex-col items-start">
//         <h2 className="text-3xl font-bold text-[#162660] mb-4">
//           Resume Analysis
//         </h2>

//         {analysis ? (
//           <div className="bg-[#F0F4FF] p-6 rounded-lg shadow-md w-full">
//             <p className="text-gray-700">
//               <strong>Resume Score:</strong> {analysis.score}%
//             </p>
//             <p className="text-gray-700">
//               <strong>Lacking Areas:</strong> {analysis.lackingAreas.join(", ")}
//             </p>
//             <p className="text-gray-700">
//               <strong>Improvements:</strong> {analysis.improvements}
//             </p>
//             <p className="text-gray-700">
//               <strong>Recommended Jobs:</strong>
//             </p>
//             <ul className="list-disc pl-5 text-gray-700">
//               {analysis.recommendedJobs.map((job, index) => (
//                 <li key={index}>{job}</li>
//               ))}
//             </ul>
//           </div>
//         ) : (
//           <p className="text-gray-600">Upload a resume to see the analysis.</p>
//         )}
//       </div>
//     </div>
//   );
// }

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

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<{
    score: number;
    lackingAreas: string[];
    improvements: string[];
    recommendedJobs: string[];
  } | null>(null);
  const [uploading, setUploading] = useState(false);

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

    // Simulating API call with mock data
    setTimeout(() => {
      const mockAnalysis = {
        score: 78,
        lackingAreas: [
          "Comprehensive Technical Skills",
          "Detailed Project Descriptions",
          "Quantifiable Achievements",
        ],
        improvements: [
          "Expand technical skills section with specific technologies",
          "Add measurable outcomes for each project (e.g., performance improvements, user growth)",
          "Include certifications or relevant training",
          "Tailor resume to specific job descriptions",
        ],
        recommendedJobs: [
          "Software Engineer",
          "Frontend Developer",
          "Full Stack Developer",
          "DevOps Engineer",
        ],
      };

      setAnalysis(mockAnalysis);
      setUploading(false);
    }, 1500); // Simulate network delay
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Left Side: Resume Upload & Preview */}
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
        </div>

        {/* Right Side: Analysis Results */}
        <div className="flex flex-col">
          <h2 className="text-2xl md:text-3xl font-bold text-[#162660] mb-6 flex items-center">
            <CheckCircle2 className="mr-3 text-[#162660]" />
            Resume Analysis
          </h2>

          {analysis ? (
            <div className="bg-[#F0F4FF] p-6 rounded-xl shadow-md space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-gray-200">
                <span className="text-gray-700 font-semibold">
                  Resume Score
                </span>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-[#162660] mr-2">
                    {analysis.score}%
                  </span>
                  {analysis.score >= 75 ? (
                    <CheckCircle2 className="text-green-500" />
                  ) : (
                    <AlertTriangle className="text-yellow-500" />
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#162660] mb-2">
                  Lacking Areas
                </h3>
                <ul className="list-disc pl-5 text-gray-700 space-y-1">
                  {analysis.lackingAreas.map((area, index) => (
                    <li key={index}>{area}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#162660] mb-2">
                  Improvements
                </h3>
                <ul className="list-disc pl-5 text-gray-700 space-y-1">
                  {analysis.improvements.map((improvement, index) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#162660] mb-2">
                  Recommended Jobs
                </h3>
                <ul className="list-disc pl-5 text-gray-700 space-y-1">
                  {analysis.recommendedJobs.map((job, index) => (
                    <li key={index}>{job}</li>
                  ))}
                </ul>
              </div>
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
