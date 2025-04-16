// src/lib/middlewares/authMiddleware.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

type UserPayload = {
  userId?: string;
  _id?: string;
  id?: string;
  role?: string;
  [key: string]: any;
};

/**
 * Authentication middleware for Next.js API routes
 */
export async function authMiddleware(
  request: NextRequest,
  handler: (req: NextRequest, user: UserPayload) => Promise<NextResponse>
) {
  // Extract token from Authorization header
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return NextResponse.json(
      { error: "Access denied. No token provided." },
      { status: 401 }
    );
  }

  // Remove "Bearer " prefix if present
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    return NextResponse.json(
      { error: "Access denied. Invalid token format." },
      { status: 401 }
    );
  }

  try {
    // Verify the secret exists
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Use environment variable for secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as UserPayload;
    
    // Ensure userId is explicitly set in the user object as a string
    const user: UserPayload = {
      ...decoded,
      userId: (decoded.userId || decoded._id || decoded.id || '').toString()
    };
    
    // Pass the authenticated user to the handler
    return handler(request, user);
  } catch (err: any) {
    console.error("Token Verification Error:", err);
    
    // Provide more detailed error handling
    if (err.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: "Token has expired" },
        { status: 401 }
      );
    }
    if (err.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "Authentication failed", details: err.message },
      { status: 400 }
    );
  }
}

/**
 * Role-based access middleware for Next.js API routes
 */
export function withRoles(roles: string | string[]) {
  return async function(
    request: NextRequest,
    user: UserPayload,
    handler: (req: NextRequest, user: UserPayload) => Promise<NextResponse>
  ) {
    // Accept single role or array of roles
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!user || !user.role || !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { 
          error: "Access denied", 
          message: "You do not have permission to access this resource" 
        },
        { status: 403 }
      );
    }
    
    // Pass to the handler if role is allowed
    return handler(request, user);
  };
}

// Usage example function that combines both middlewares
export function withAuth(roles?: string | string[]) {
  return async function(
    request: NextRequest,
    handler: (req: NextRequest, user: UserPayload) => Promise<NextResponse>
  ) {
    return authMiddleware(request, async (req, user) => {
      // If roles are specified, verify role
      if (roles) {
        return withRoles(roles)(req, user, handler);
      }
      
      // Otherwise just pass the authenticated user
      return handler(req, user);
    });
  };
}