// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User from "@/lib/models/UserModel";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email, password, role } = await request.json();

    // Check if email, password, and role are provided
    if (!email || !password || !role) {
      return NextResponse.json(
        {
          error: "Email, password, and role are required",
        },
        { status: 400 }
      );
    }

    // Find user by email and role
    const user = await User.findOne({ email, role });
    if (!user) {
      return NextResponse.json(
        {
          error: "User not found or incorrect role",
          field: "email",
        },
        { status: 404 }
      );
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        {
          error: "Invalid credentials",
          field: "password",
        },
        { status: 401 }
      );
    }

    // Generate token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    // Successful login response
    return NextResponse.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      {
        error: "Server error during login",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
