// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User from "@/lib/models/UserModel";

// Helper function for validation
function validateSignupInput(data: any) {
  const { name, email, password, role } = data;
  const errors = [];

  // Validate name
  if (!name || name.trim().length < 2) {
    errors.push({
      field: "name",
      message: "Name must be at least 2 characters long",
    });
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push({
      field: "email",
      message: "Please provide a valid email",
    });
  }

  // Validate password
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  if (!password || !passwordRegex.test(password)) {
    errors.push({
      field: "password",
      message:
        "Password must include uppercase, lowercase, number, and special character and be at least 6 characters long",
    });
  }

  // Validate role
  if (!role || !["candidate", "recruiter"].includes(role)) {
    errors.push({
      field: "role",
      message: "Role must be either 'candidate' or 'recruiter'",
    });
  }

  return errors;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const data = await request.json();

    // Validate input
    const validationErrors = validateSignupInput(data);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password, role } = data;

    // Detailed logging
    console.log("Signup Request:", { name, email, role });

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          error: "User with this email already exists",
          field: "email",
        },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    // Generate token
    const token = jwt.sign(
      {
        userId: newUser._id,
        role: newUser.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    // Successful response
    return NextResponse.json(
      {
        message: "Signup successful",
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup Error:", error);
    return NextResponse.json(
      {
        error: "Server error during signup",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
