const firebaseConfig = require("../config/firebase");

/**
 * Middleware to verify Firebase ID tokens
 * Extracts user information from the token and adds it to req.user
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No valid token provided",
      });
    }

    const idToken = authHeader.split("Bearer ")[1];

    if (!idToken) {
      return res.status(401).json({
        success: false,
        error: "No token found in authorization header",
      });
    }

    // Verify the token using Firebase Admin SDK
    const decodedToken = await firebaseConfig.getAuth().verifyIdToken(idToken);

    // Add user information to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error);

    // Handle specific Firebase auth errors
    let errorMessage = "Invalid token";

    if (error.code === "auth/id-token-expired") {
      errorMessage = "Token has expired";
    } else if (error.code === "auth/id-token-revoked") {
      errorMessage = "Token has been revoked";
    } else if (error.code === "auth/argument-error") {
      errorMessage = "Invalid token format";
    }

    res.status(401).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * Optional middleware to verify token but don't fail if missing
 * Useful for endpoints that work for both authenticated and unauthenticated users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const idToken = authHeader.split("Bearer ")[1];

    if (!idToken) {
      req.user = null;
      return next();
    }

    const decodedToken = await firebaseConfig.getAuth().verifyIdToken(idToken);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
    };

    next();
  } catch (error) {
    // If token verification fails, continue without user
    console.warn("Optional auth failed:", error.message);
    req.user = null;
    next();
  }
};

module.exports = {
  verifyToken,
  optionalAuth,
};
