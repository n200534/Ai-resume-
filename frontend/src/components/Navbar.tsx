"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

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

  // Hide Navbar on the login page
  if (pathname === "/auth/login") return null;
  if (pathname === "/auth/signup") return null;
  return (
    <nav className="flex items-center justify-between px-8 py-4 shadow-sm bg-white">
      {/* Left: Logo */}
      <div className="text-xl font-bold flex items-center space-x-2">
        <span className="text-blue-700"></span>{" "}
        {/* Replace with an actual logo */}
        <span className="text-[#1E2A41] font-semibold">JobFit AI</span>
      </div>

      {/* Center: Navigation - Dynamic based on role */}
      <div className="flex bg-blue-100 px-6 py-2 rounded-full space-x-6 text-gray-600">
        <Link
          href="/"
          className={`hover:text-[#162660] ${
            pathname === "/" ? "text-[#162660] font-semibold" : ""
          }`}
        >
          Home
        </Link>

        {userRole === "recruiter" ? (
          <>
            <Link
              href="/post-job"
              className={`hover:text-[#162660] ${
                pathname === "/post-job" ? "text-[#162660] font-semibold" : ""
              }`}
            >
              Post Job
            </Link>
            <Link
              href="/my-jobs"
              className={`hover:text-[#162660] ${
                pathname === "/my-jobs" ? "text-[#162660] font-semibold" : ""
              }`}
            >
              My Jobs
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/jobs"
              className={`hover:text-[#162660] ${
                pathname === "/jobs" ? "text-[#162660] font-semibold" : ""
              }`}
            >
              Jobs
            </Link>
            <Link
              href="/resume"
              className={`hover:text-[#162660] ${
                pathname === "/resume" ? "text-[#162660] font-semibold" : ""
              }`}
            >
              Resume
            </Link>
          </>
        )}
      </div>

      {/* Right: Log Out Button */}
      <button
        onClick={() => {
          localStorage.removeItem("userRole"); // Clear role on logout
          localStorage.removeItem("isAuthenticated");
          window.location.href = "/auth/login"; // Redirect to login
        }}
        className="bg-[#162660] text-white px-6 py-2 rounded-full hover:bg-[#162035] cursor-pointer"
      >
        Log Out
      </button>
    </nav>
  );
}
