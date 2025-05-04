"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react"; // Import icons

// Define possible user roles
type UserRole = "candidate" | "recruiter" | null;

// AuthContext interface to make auth state management more reliable
interface AuthState {
  isAuthenticated: boolean;
  userRole: UserRole;
}

export default function Navbar() {
  // Create a state for client-side rendering
  const [isClient, setIsClient] = useState(false);
  // Use a null initial state to avoid hydration mismatches
  const [authState, setAuthState] = useState<AuthState | null>(null);
  // State for mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = usePathname();

  // Handle user logout
  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");

    // Update state immediately before redirect
    setAuthState({
      isAuthenticated: false,
      userRole: null,
    });

    // Use timeout to ensure state updates before redirect
    setTimeout(() => {
      window.location.href = "/auth/login";
    }, 0);
  };

  // Update auth state from localStorage
  const updateAuthState = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole") as UserRole;

    setAuthState({
      isAuthenticated: !!token,
      userRole: role,
    });
  };

  useEffect(() => {
    // Mark as client-side rendered
    setIsClient(true);

    // Initialize auth state
    updateAuthState();

    // Listen for storage events to support multi-tab synchronization
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "token" || event.key === "userRole") {
        updateAuthState();
      }
    };

    // Listen for the custom auth-change event from login form
    const handleAuthChange = () => {
      console.log("Auth change event detected");
      updateAuthState();
    };

    // Add event listeners
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-change", handleAuthChange);

    // For immediate login detection, check auth state after a short delay
    const checkInitialAuth = setTimeout(() => {
      updateAuthState();
    }, 100);

    // Polling fallback (check every second for auth changes)
    const authCheckInterval = setInterval(() => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userRole");

      // Only update if there's a change to prevent unnecessary renders
      if (
        !!token !== authState?.isAuthenticated ||
        role !== authState?.userRole
      ) {
        updateAuthState();
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-change", handleAuthChange);
      clearTimeout(checkInitialAuth);
      clearInterval(authCheckInterval);
    };
  }, [authState?.isAuthenticated, authState?.userRole]);

  // Don't render anything during SSR or if we're on auth pages
  if (!isClient || pathname === "/auth/login" || pathname === "/auth/signup") {
    return null;
  }

  // If auth state is still loading or user is not authenticated, don't render navbar
  if (!authState || !authState.isAuthenticated || !authState.userRole) {
    return null;
  }

  const { userRole } = authState;

  return (
    <nav className="flex items-center justify-between px-4 md:px-8 py-4 shadow-md bg-white sticky top-0 z-50">
      {/* Left: Logo */}
      <div className="text-xl font-bold flex items-center space-x-2">
        <div className="h-8 w-8 rounded-md bg-[#162660] flex items-center justify-center text-white">
          JF
        </div>
        <span className="text-[#1E2A41] font-semibold hidden md:block">
          JobFit AI
        </span>
      </div>

      {/* Center: Desktop Navigation */}
      <div className="hidden md:flex bg-blue-100 px-6 py-2 rounded-full space-x-8 text-gray-600">
        <Link
          href="/"
          className={`hover:text-[#162660] transition-colors ${
            pathname === "/" ? "text-[#162660] font-semibold" : ""
          }`}
        >
          Home
        </Link>

        {userRole === "recruiter" ? (
          <>
            <Link
              href="/post-job"
              className={`hover:text-[#162660] transition-colors ${
                pathname === "/post-job" ? "text-[#162660] font-semibold" : ""
              }`}
            >
              Post Job
            </Link>
            <Link
              href="/my-jobs"
              className={`hover:text-[#162660] transition-colors ${
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
              className={`hover:text-[#162660] transition-colors ${
                pathname === "/jobs" ? "text-[#162660] font-semibold" : ""
              }`}
            >
              Jobs
            </Link>
            <Link
              href="/resume"
              className={`hover:text-[#162660] transition-colors ${
                pathname === "/resume" ? "text-[#162660] font-semibold" : ""
              }`}
            >
              Resume
            </Link>
          </>
        )}
      </div>

      {/* Right: Log Out Button (desktop) */}
      <button
        onClick={handleLogout}
        className="hidden md:flex bg-[#162660] text-white px-6 py-2 rounded-full hover:bg-[#162035] transition-colors items-center space-x-2"
      >
        <span>Log Out</span>
        <LogOut size={16} />
      </button>

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden text-[#162660]"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-lg rounded-b-lg p-4 z-50 border-t">
          <div className="flex flex-col space-y-4">
            <Link
              href="/"
              className={`hover:text-[#162660] px-4 py-2 rounded ${
                pathname === "/"
                  ? "bg-blue-100 text-[#162660] font-semibold"
                  : ""
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>

            {userRole === "recruiter" ? (
              <>
                <Link
                  href="/post-job"
                  className={`hover:text-[#162660] px-4 py-2 rounded ${
                    pathname === "/post-job"
                      ? "bg-blue-100 text-[#162660] font-semibold"
                      : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Post Job
                </Link>
                <Link
                  href="/my-jobs"
                  className={`hover:text-[#162660] px-4 py-2 rounded ${
                    pathname === "/my-jobs"
                      ? "bg-blue-100 text-[#162660] font-semibold"
                      : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Jobs
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/jobs"
                  className={`hover:text-[#162660] px-4 py-2 rounded ${
                    pathname === "/jobs"
                      ? "bg-blue-100 text-[#162660] font-semibold"
                      : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Jobs
                </Link>
                <Link
                  href="/resume"
                  className={`hover:text-[#162660] px-4 py-2 rounded ${
                    pathname === "/resume"
                      ? "bg-blue-100 text-[#162660] font-semibold"
                      : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Resume
                </Link>
              </>
            )}

            <button
              onClick={handleLogout}
              className="bg-[#162660] text-white px-4 py-2 rounded-full hover:bg-[#162035] transition-colors flex items-center justify-center space-x-2"
            >
              <span>Log Out</span>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
