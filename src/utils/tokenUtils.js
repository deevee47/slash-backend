const jwt = require("jsonwebtoken");

class TokenUtils {
  /**
   * Generate JWT access token (15 minutes default)
   */
  static generateAccessToken(userId, email) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }

    const expiresIn = parseInt(process.env.ACCESS_TOKEN_EXPIRY) || 900; // 15 minutes default

    return jwt.sign(
      {
        sub: userId,
        email: email,
        type: "access",
      },
      secret,
      {
        expiresIn: expiresIn,
      }
    );
  }

  /**
   * Verify and decode JWT access token
   */
  static verifyAccessToken(token) {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error("JWT_SECRET environment variable is not set");
      }

      const decoded = jwt.verify(token, secret);

      // Ensure it's an access token
      if (decoded.type !== "access") {
        const error = new Error("Invalid token type");
        error.code = "INVALID_TOKEN_TYPE";
        throw error;
      }

      return decoded;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        const err = new Error("Token expired");
        err.code = "TOKEN_EXPIRED";
        throw err;
      }
      if (error.name === "JsonWebTokenError") {
        const err = new Error("Invalid token");
        err.code = "INVALID_TOKEN";
        throw err;
      }
      throw error;
    }
  }

  /**
   * Get access token expiry in seconds
   */
  static getAccessTokenExpiry() {
    return parseInt(process.env.ACCESS_TOKEN_EXPIRY) || 900;
  }

  /**
   * Get refresh token expiry in seconds
   */
  static getRefreshTokenExpiry() {
    return parseInt(process.env.REFRESH_TOKEN_EXPIRY) || 15552000; // 180 days
  }
}

module.exports = TokenUtils;
