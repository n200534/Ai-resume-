"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"candidate" | "recruiter" | "">("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false); // For hydration safety

  // Get API URL with fallback
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // Set isClient to true after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validate role selection
    if (!role) {
      setError("Please select a role (Job Seeker or Recruiter)");
      setIsLoading(false);
      return;
    }

    try {
      // Validate API_URL is available
      if (!API_URL) {
        throw new Error(
          "API URL is not configured. Check your environment variables."
        );
      }

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // More detailed error handling
        const errorMessage = data.error || data.message || "Login failed";
        setError(errorMessage);
        console.error("Login Error Details:", data);
        setIsLoading(false);
        return;
      }

      // Validate token exists in response
      if (!data.token) {
        setError("Server response missing authentication token");
        setIsLoading(false);
        return;
      }

      // Store auth data
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", role);
      localStorage.setItem("userEmail", email);

      // CRITICAL FIX: Dispatch a custom event that the NavBar can listen for
      // This fixes the issue where NavBar is only visible after page refresh
      // Create and dispatch the event with a specified name
      const authChangeEvent = new CustomEvent("auth-change");
      window.dispatchEvent(authChangeEvent);

      console.log("Auth change event dispatched");

      // Force a short delay to ensure localStorage is updated before navigation
      setTimeout(() => {
        // Navigate to the appropriate page based on role
        router.push("/");
      }, 100);
    } catch (error) {
      console.error("Network or Parsing Error:", error);
      setError("An error occurred during login. Please try again.");
      setIsLoading(false);
    }
  };

  // Email validation
  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  // For Google login (placeholder)
  const handleGoogleLogin = () => {
    // Implement Google login logic or redirect
    alert("Google login feature coming soon!");
  };

  return (
    <div
      className={cn("flex items-center justify-center p-6", className)}
      {...props}
    >
      <Card className="w-full max-w-md shadow-xl border border-[#162660] bg-white rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#162660]">
            Login to Your Account
          </CardTitle>
          <CardDescription className="text-gray-600">
            Enter your credentials to access the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-[#162660] font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  // Clear error when user starts typing
                  if (error) setError(null);
                }}
                className="border border-[#162660] focus:ring-2 focus:ring-[#D0E6FD]"
                aria-invalid={email && !isValidEmail(email) ? "true" : "false"}
              />
              {email && !isValidEmail(email) && (
                <p className="text-red-500 text-xs mt-1">
                  Please enter a valid email address
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-[#162660] font-medium"
                >
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-[#0f1d40] hover:text-[#162660] underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  // Clear error when user starts typing
                  if (error) setError(null);
                }}
                className="border border-[#162660] focus:ring-2 focus:ring-[#D0E6FD]"
                aria-invalid={
                  password && password.length < 6 ? "true" : "false"
                }
              />
              {password && password.length < 6 && (
                <p className="text-red-500 text-xs mt-1">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            {/* Role Selection */}
            <div className="grid gap-2">
              <Label className="text-[#162660] font-medium">Login As</Label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 text-[#162660] cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="candidate"
                    checked={role === "candidate"}
                    onChange={() => {
                      setRole("candidate");
                      if (error) setError(null);
                    }}
                    className="accent-[#162660]"
                  />
                  <span>Job Seeker</span>
                </label>
                <label className="flex items-center space-x-2 text-[#162660] cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="recruiter"
                    checked={role === "recruiter"}
                    onChange={() => {
                      setRole("recruiter");
                      if (error) setError(null);
                    }}
                    className="accent-[#162660]"
                  />
                  <span>Recruiter</span>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-sm text-center p-2 bg-red-50 rounded-md border border-red-100">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                disabled={isLoading || !isClient}
                className="w-full bg-[#162660] hover:bg-[#0f1d40] text-white h-11 transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </span>
                ) : (
                  "Login"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full border-[#162660] text-[#162660] hover:bg-[#D0E6FD] h-11 transition-colors"
              >
                Login with Google
              </Button>
            </div>

            <div className="mt-4 text-center text-sm text-[#162660]">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="underline underline-offset-4 text-[#0f1d40] hover:text-[#162660] font-medium"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
