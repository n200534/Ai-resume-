"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"jobSeeker" | "recruiter" | null>(
    null
  );

  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated") === "true";
    const role = localStorage.getItem("userRole") as
      | "jobSeeker"
      | "recruiter"
      | null;

    if (!auth) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, [router]);

  if (!isAuthenticated || !userRole) return null; // Prevent flicker

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center scrollbar-hide">
      {/* Navbar */}
      {/* <header className="absolute top-4 left-4 text-xl font-bold">SaasAble</header>
      <nav className="absolute top-4 right-4">
        <Button variant="outline" onClick={() => {
          localStorage.clear();
          router.push("/login");
        }}>
          Log Out
        </Button>
      </nav> */}

      {/* Navigation Menu */}
      {/* <div className="flex gap-4 mb-6">
        <Button variant="ghost" className="bg-blue-200">Home</Button>
        <Button variant="ghost">Jobs</Button>
        <Button variant="ghost">Resume</Button>
      </div> */}

      {/* Banner */}
      <span className="px-4 py-2 text-sm font-medium bg-blue-100 rounded-full">
        AI with endless <span className="font-bold">Possibilities</span>
      </span>

      {/* Main Heading */}
      <h1 className="mt-4 text-4xl font-bold">
        {userRole === "jobSeeker"
          ? "Find Your Perfect Job with AI-Powered Resume Screening"
          : "Find the Best Candidates with AI-Driven Matching"}
      </h1>

      {/* Subtext */}
      <p className="mt-4 text-lg text-gray-600 max-w-lg">
        {userRole === "jobSeeker"
          ? "Upload your resume and get an AI-generated score to match you with the best job opportunities based on your skills."
          : "Post a job and let AI match the best candidates for your role instantly."}
      </p>

      {/* Call-to-Action Button */}
      <Button
        className="mt-6 bg-[#162660] hover:bg-[#162035] text-white px-6 py-3 rounded-full"
        onClick={() =>
          router.push(userRole === "jobSeeker" ? "/jobs" : "/post-job")
        }
      >
        {userRole === "jobSeeker" ? "Start Now →" : "Post a Job →"}
      </Button>
    </div>
  );
}
