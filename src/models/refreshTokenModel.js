const mongoose = require("mongoose");
const crypto = require("crypto");

// RefreshToken Schema
const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index - automatically delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create the model
const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

/**
 * Generate a secure refresh token
 */
const generateToken = () => {
  return `rtk_${crypto.randomBytes(32).toString("hex")}`;
};

/**
 * Hash token using HMAC-SHA256
 */
const hashToken = (token) => {
  const secret = process.env.REFRESH_TOKEN_SECRET;

  if (!secret) {
    throw new Error("REFRESH_TOKEN_SECRET environment variable is not set");
  }

  return crypto.createHmac("sha256", secret).update(token).digest("hex");
};

/**
 * Create a new refresh token
 */
const create = async (userId) => {
  try {
    const token = generateToken();
    const tokenHash = hashToken(token);

    const expiresIn = parseInt(process.env.REFRESH_TOKEN_EXPIRY) || 15552000; // 180 days default
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await RefreshToken.create({
      userId: new mongoose.Types.ObjectId(userId),
      tokenHash,
      expiresAt,
      lastUsedAt: new Date(),
    });

    return token; // Return unhashed token to send to client
  } catch (error) {
    throw error;
  }
};

/**
 * Find refresh token by token value
 */
const findByToken = async (token) => {
  try {
    const tokenHash = hashToken(token);

    const refreshToken = await RefreshToken.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() }, // Not expired
    }).lean();

    if (!refreshToken) {
      return null;
    }

    return {
      id: refreshToken._id.toString(),
      userId: refreshToken.userId.toString(),
      tokenHash: refreshToken.tokenHash,
      expiresAt: refreshToken.expiresAt,
      lastUsedAt: refreshToken.lastUsedAt,
      createdAt: refreshToken.createdAt,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Delete refresh token by token value
 */
const deleteByToken = async (token) => {
  try {
    const tokenHash = hashToken(token);

    const result = await RefreshToken.deleteOne({ tokenHash });
    return result.deletedCount > 0;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete all refresh tokens for a user
 */
const deleteAllForUser = async (userId) => {
  try {
    const result = await RefreshToken.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
    });

    return result.deletedCount;
  } catch (error) {
    throw error;
  }
};

/**
 * Update last used timestamp
 */
const updateLastUsed = async (token) => {
  try {
    const tokenHash = hashToken(token);

    await RefreshToken.updateOne(
      { tokenHash },
      { lastUsedAt: new Date() }
    );

    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  create,
  findByToken,
  deleteByToken,
  deleteAllForUser,
  updateLastUsed,
};
