const express = require("express");
const router = express.Router();
const { getAuth } = require("../config/firebase");
const userModel = require("../models/userModel");
const refreshTokenModel = require("../models/refreshTokenModel");
const TokenUtils = require("../utils/tokenUtils");
const auditModel = require("../models/auditModel");

/**
 * POST /auth/firebase
 * Exchange Firebase ID token for backend access + refresh tokens
 */
router.post("/firebase", async (req, res) => {
  try {
    // 1. Extract Firebase ID token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "No Firebase token provided",
        code: "NO_TOKEN",
      });
    }

    const firebaseIdToken = authHeader.split("Bearer ")[1];

    // 2. Verify Firebase ID token with Firebase Admin SDK
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(firebaseIdToken);
    } catch (error) {
      console.error("Firebase token verification failed:", error);

      if (error.code === "auth/id-token-expired") {
        return res.status(401).json({
          error: "Firebase token expired",
          code: "FIREBASE_TOKEN_EXPIRED",
        });
      }

      return res.status(401).json({
        error: "Invalid Firebase token",
        code: "INVALID_FIREBASE_TOKEN",
      });
    }

    // 3. Extract user data from Firebase token
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({
        error: "Email not found in Firebase token",
        code: "NO_EMAIL",
      });
    }

    // 4. Create or update user in MongoDB
    const user = await userModel.syncUser({
      uid,
      email,
      displayName: name || email.split("@")[0],
      photoURL: picture || null,
      lastLoginAt: new Date().toISOString(),
    });

    // 5. Generate access token (JWT, 15 minutes)
    const accessToken = TokenUtils.generateAccessToken(user.id, user.email);

    // 6. Generate refresh token (secure random, 180 days)
    const refreshToken = await refreshTokenModel.create(user.id);

    // 7. Create audit log
    await auditModel.createAuditLog({
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName,
      action: "firebase_token_exchange",
      resource: "auth",
      method: "POST",
      url: "/auth/firebase",
      status: "success",
      statusCode: 200,
      details: {
        operation: "token_exchange",
        firebaseUid: uid,
      },
    });

    // 8. Return tokens to client
    res.json({
      accessToken,
      refreshToken,
      expiresIn: TokenUtils.getAccessTokenExpiry(), // in seconds
    });
  } catch (error) {
    console.error("Firebase auth error:", error);

    // Create audit log for failure
    try {
      await auditModel.createAuditLog({
        action: "firebase_token_exchange_failed",
        resource: "auth",
        method: "POST",
        url: "/auth/firebase",
        status: "error",
        statusCode: 500,
        details: {
          error: error.message,
        },
      });
    } catch (auditError) {
      // Ignore audit logging errors
    }

    res.status(500).json({
      error: "Authentication failed",
      code: "SERVER_ERROR",
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token (with rotation)
 */
router.post("/refresh", async (req, res) => {
  try {
    // 1. Extract refresh token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "No refresh token provided",
        code: "NO_TOKEN",
      });
    }

    const refreshToken = authHeader.split("Bearer ")[1];

    // 2. Find refresh token in database
    const tokenDoc = await refreshTokenModel.findByToken(refreshToken);

    if (!tokenDoc) {
      return res.status(401).json({
        error: "Invalid or expired refresh token",
        code: "INVALID_REFRESH_TOKEN",
      });
    }

    // 3. Get user
    const user = await userModel.findById(tokenDoc.userId);

    if (!user) {
      return res.status(401).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // 4. Generate new access token
    const newAccessToken = TokenUtils.generateAccessToken(user.id, user.email);

    // 5. ROTATE refresh token (security best practice)
    // Delete old refresh token
    await refreshTokenModel.deleteByToken(refreshToken);

    // Generate new refresh token
    const newRefreshToken = await refreshTokenModel.create(user.id);

    // 6. Create audit log
    await auditModel.createAuditLog({
      userId: user.firebaseUid,
      userEmail: user.email,
      userName: user.displayName,
      action: "token_refresh",
      resource: "auth",
      method: "POST",
      url: "/auth/refresh",
      status: "success",
      statusCode: 200,
      details: {
        operation: "token_rotation",
      },
    });

    // 7. Return new tokens
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken, // NEW rotated token
      expiresIn: TokenUtils.getAccessTokenExpiry(),
    });
  } catch (error) {
    console.error("Token refresh error:", error);

    res.status(500).json({
      error: "Token refresh failed",
      code: "SERVER_ERROR",
    });
  }
});

/**
 * POST /auth/logout
 * Revoke refresh token
 */
router.post("/logout", async (req, res) => {
  try {
    // 1. Extract refresh token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided - consider it already logged out
      return res.json({
        success: true,
        message: "Already logged out",
      });
    }

    const refreshToken = authHeader.split("Bearer ")[1];

    // 2. Delete refresh token from database
    const deleted = await refreshTokenModel.deleteByToken(refreshToken);

    // 3. Get user info for audit log (if token was valid)
    if (deleted) {
      // Create audit log
      try {
        await auditModel.createAuditLog({
          action: "logout",
          resource: "auth",
          method: "POST",
          url: "/auth/logout",
          status: "success",
          statusCode: 200,
          details: {
            operation: "revoke_refresh_token",
          },
        });
      } catch (auditError) {
        // Ignore audit logging errors
      }

      return res.json({
        success: true,
        message: "Logged out successfully",
      });
    }

    // Token not found - might already be logged out
    return res.json({
      success: true,
      message: "Already logged out",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Logout failed",
      code: "SERVER_ERROR",
    });
  }
});

module.exports = router;
