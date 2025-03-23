"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  // Hide Navbar on the login page
  if (pathname === "/login") return null;

  return (
    <nav className="flex items-center justify-between px-8 py-4 shadow-sm bg-white">
      {/* Left: Logo */}
      <div className="text-xl font-bold flex items-center space-x-2">
        <span className="text-blue-700">🤖</span>{" "}
        {/* Replace with an actual logo */}
        <span className="text-[#1E2A41] font-semibold">JobFit AI</span>
      </div>

      {/* Center: Navigation */}
      <div className="flex bg-blue-100 px-6 py-2 rounded-full space-x-6 text-gray-600">
        <Link
          href="/"
          className={`hover:text-[#162660]-700 ${
            pathname === "/" ? "text-[#162660] font-semibold" : ""
          }`}
        >
          Home
        </Link>
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
      </div>

      {/* Right: Log Out Button */}
      <Link href="/login">
        <button className="bg-[#162660] text-white px-6 py-2 rounded-full hover:bg-[#162035] cursor-pointer">
          Log Out
        </button>
      </Link>
    </nav>
  );
}
