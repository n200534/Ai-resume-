"use client";

import Link from "next/link";
import { useState } from "react";
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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"candidate" | "recruiter" | "">("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate role selection
    if (!role) {
      setError("Please select a role (Job Seeker or Recruiter)");
      return;
    }

    try {
      const response = await fetch("http://localhost:5001/api/auth/login", {
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
      console.log("Server Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Explicitly set local storage with role and token
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", role);
      
      // Debug logging
      console.log("Stored Token:", localStorage.getItem("token"));
      console.log("Stored User Role:", localStorage.getItem("userRole"));

      // Routing based on role
      router.push(role === "candidate" ? "/" : "/");
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    }
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
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-5">
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="border border-[#162660] focus:ring-[#D0E6FD]"
                />
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
                  onChange={(e) => setPassword(e.target.value)}
                  className="border border-[#162660] focus:ring-[#D0E6FD]"
                />
              </div>

              {/* Role Selection */}
              <div className="grid gap-2">
                <Label className="text-[#162660] font-medium">Login As</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2 text-[#162660]">
                    <input
                      type="radio"
                      name="role"
                      value="candidate"
                      checked={role === "candidate"}
                      onChange={() => setRole("candidate")}
                      className="accent-[#162660]"
                    />
                    <span>Job Seeker</span>
                  </label>
                  <label className="flex items-center space-x-2 text-[#162660]">
                    <input
                      type="radio"
                      name="role"
                      value="recruiter"
                      checked={role === "recruiter"}
                      onChange={() => setRole("recruiter")}
                      className="accent-[#162660]"
                    />
                    <span>Recruiter</span>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-500 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full bg-[#162660] hover:bg-[#0f1d40] text-white"
                >
                  Login
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-[#162660] text-[#162660] hover:bg-[#D0E6FD]"
                >
                  Login with Google
                </Button>
              </div>
            </div>

            <div className="mt-4 text-center text-sm text-[#162660]">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="underline underline-offset-4 text-[#0f1d40] hover:text-[#162660]"
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