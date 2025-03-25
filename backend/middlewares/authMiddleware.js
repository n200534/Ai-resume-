const jwt = require("jsonwebtoken");
require('dotenv').config(); // Ensure environment variables are loaded

// Middleware to protect routes
const authMiddleware = (req, res, next) => {
  // Extract token from Authorization header
  // Typically, tokens are sent as "Bearer <token>"
  const authHeader = req.header("Authorization");
  
  if (!authHeader) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  // Remove "Bearer " prefix if present
  const token = authHeader.startsWith("Bearer ") 
    ? authHeader.slice(7) 
    : authHeader;

  if (!token) {
    return res.status(401).json({ error: "Access denied. Invalid token format." });
  }

  try {
    // Use environment variable for secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify the secret exists
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      return res.status(500).json({ error: "Server configuration error" });
    }

    req.user = decoded; // Attach user info to request
    next();
  } catch (err) {
    console.error("Token Verification Error:", err);
    
    // Provide more detailed error handling
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token has expired" });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    res.status(400).json({ error: "Authentication failed", details: err.message });
  }
};

// Middleware for role-based access
const roleMiddleware = (roles) => {
  return (req, res, next) => {
    // Accept single role or array of roles
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Access denied", 
        message: "You do not have permission to access this resource" 
      });
    }
    
    next();
  };
};

module.exports = { authMiddleware, roleMiddleware };
