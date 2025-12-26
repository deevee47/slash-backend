const TokenUtils = require("../utils/tokenUtils");
const userModel = require("../models/userModel");

/**
 * Middleware to verify JWT access token
 */
const verifyAccessToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "No access token provided",
        code: "NO_TOKEN",
      });
    }

    const accessToken = authHeader.split("Bearer ")[1];

    // Verify JWT
    let decoded;
    try {
      decoded = TokenUtils.verifyAccessToken(accessToken);
    } catch (error) {
      if (error.code === "TOKEN_EXPIRED") {
        return res.status(401).json({
          error: "Token expired",
          code: "TOKEN_EXPIRED",
        });
      }

      return res.status(401).json({
        error: "Invalid token",
        code: "INVALID_TOKEN",
      });
    }

    // Get user from database
    const user = await userModel.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Attach user info to request (MongoDB user ID)
    req.userId = decoded.sub; // MongoDB _id
    req.userEmail = decoded.email;
    req.user = {
      id: user.id,
      uid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({
      error: "Authentication failed",
      code: "AUTH_FAILED",
    });
  }
};

module.exports = verifyAccessToken;
