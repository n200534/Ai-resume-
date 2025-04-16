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

interface ValidationError {
  field: string;
  message: string;
}
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"candidate" | "recruiter" | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    // Basic client-side validation
    const validationErrors: Record<string, string> = {};
    if (!name.trim()) validationErrors.name = "Name is required";
    if (!email.trim()) validationErrors.email = "Email is required";
    if (!password) validationErrors.password = "Password is required";
    if (!role) validationErrors.role = "Role is required";

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors or specific error messages
        if (data.errors) {
          // Handle multiple validation errors
          const errorMap: Record<string, string> = {};
          data.errors.forEach((err: ValidationError) => {
            errorMap[err.field] = err.message;
          });
          setFieldErrors(errorMap);
          throw new Error("Signup validation failed");
        }

        // Handle single error message
        throw new Error(data.error || "Sign-up failed");
      }

      // Store token & role
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", data.user.role);

      // Redirect based on role
      router.push(data.user.role === "candidate" ? "/" : "/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            Create an Account
          </CardTitle>
          <CardDescription className="text-gray-600">
            Enter your details to sign up and start using the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-5">
              {/* Name Input */}
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-[#162660] font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`border ${
                    fieldErrors.name 
                      ? "border-red-500" 
                      : "border-[#162660]"
                  } focus:ring-[#D0E6FD]`}
                />
                {fieldErrors.name && (
                  <p className="text-red-500 text-sm">{fieldErrors.name}</p>
                )}
              </div>

              {/* Email Input */}
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-[#162660] font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`border ${
                    fieldErrors.email 
                      ? "border-red-500" 
                      : "border-[#162660]"
                  } focus:ring-[#D0E6FD]`}
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-sm">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="grid gap-2">
                <Label
                  htmlFor="password"
                  className="text-[#162660] font-medium"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`border ${
                    fieldErrors.password 
                      ? "border-red-500" 
                      : "border-[#162660]"
                  } focus:ring-[#D0E6FD]`}
                />
                {fieldErrors.password && (
                  <p className="text-red-500 text-sm">{fieldErrors.password}</p>
                )}
              </div>

              {/* Role Selection */}
              <div className="grid gap-2">
                <Label className="text-[#162660] font-medium">Sign Up As</Label>
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
                {fieldErrors.role && (
                  <p className="text-red-500 text-sm">{fieldErrors.role}</p>
                )}
              </div>

              {/* Global Error Message */}
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              {/* Submit Buttons */}
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full bg-[#162660] hover:bg-[#0f1d40] text-white"
                  disabled={loading}
                >
                  {loading ? "Signing Up..." : "Sign Up"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-[#162660] text-[#162660] hover:bg-[#D0E6FD]"
                >
                  Sign up with Google
                </Button>
              </div>
            </div>

            {/* Login Link */}
            <div className="mt-4 text-center text-sm text-[#162660]">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="underline underline-offset-4 text-[#0f1d40] hover:text-[#162660]"
              >
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}