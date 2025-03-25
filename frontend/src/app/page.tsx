"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
require("dotenv").config();

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"candidate" | "recruiter" | null>(
    null
  );

  useEffect(() => {
    // Check authentication on client-side
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole") as
        | "candidate"
        | "recruiter"
        | null;

      if (!token) {
        router.push("/auth/login");
      } else {
        setIsAuthenticated(true);
        setUserRole(role);
      }
    };

    // Run initial check
    checkAuth();

    // Optional: Add event listener for storage changes
    window.addEventListener("storage", checkAuth);

    // Cleanup listener
    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, [router]);

  if (!isAuthenticated || !userRole) return null; // Prevent flicker

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center scrollbar-hide">
      <span className="px-4 py-2 text-sm font-medium bg-blue-100 rounded-full">
        AI with endless <span className="font-bold">Possibilities</span>
      </span>

      <h1 className="mt-4 text-4xl font-bold">
        {userRole === "candidate"
          ? "Find Your Perfect Job with AI-Powered Resume Screening"
          : "Find the Best Candidates with AI-Driven Matching"}
      </h1>

      <p className="mt-4 text-lg text-gray-600 max-w-lg">
        {userRole === "candidate"
          ? "Upload your resume and get an AI-generated score to match you with the best job opportunities based on your skills."
          : "Post a job and let AI match the best candidates for your role instantly."}
      </p>

      <Button
        className="mt-6 bg-[#162660] hover:bg-[#162035] text-white px-6 py-3 rounded-full"
        onClick={() =>
          router.push(userRole === "candidate" ? "/jobs" : "/post-job")
        }
      >
        {userRole === "candidate" ? "Start Now →" : "Post a Job →"}
      </Button>
    </div>
  );
}
