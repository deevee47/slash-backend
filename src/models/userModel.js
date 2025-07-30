const mongoose = require("mongoose");

// User Schema
const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      default: null,
      trim: true,
    },
    photoURL: {
      type: String,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Create indexes for efficient queries
userSchema.index({ uid: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

// Create the model
const User = mongoose.model("User", userSchema);

class UserModel {
  // Find user by Firebase UID
  async findByUid(uid) {
    try {
      const user = await User.findOne({ uid }).lean();

      if (!user) {
        return null;
      }

      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      throw error;
    }
  }

  // Create or update user (upsert)
  async syncUser(userData) {
    try {
      const { uid, email, displayName, photoURL, lastLoginAt } = userData;

      const user = await User.findOneAndUpdate(
        { uid }, // Find by UID
        {
          uid,
          email: email.toLowerCase().trim(),
          displayName: displayName || null,
          photoURL: photoURL || null,
          lastLoginAt: new Date(lastLoginAt),
        },
        {
          upsert: true, // Create if doesn't exist
          new: true, // Return updated document
          setDefaultsOnInsert: true, // Set defaults for new documents
          runValidators: true, // Run schema validators
        }
      ).lean();

      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      // Handle duplicate key errors
      if (error.code === 11000) {
        const duplicateError = new Error(
          "Email already exists with different UID"
        );
        duplicateError.code = "DUPLICATE_EMAIL";
        throw duplicateError;
      }
      throw error;
    }
  }

  // Update last login time
  async updateLastLogin(uid) {
    try {
      const user = await User.findOneAndUpdate(
        { uid },
        { lastLoginAt: new Date() },
        { new: true }
      ).lean();

      if (!user) {
        return null;
      }

      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user statistics
  async getUserStats(uid) {
    try {
      const user = await this.findByUid(uid);
      if (!user) {
        return null;
      }

      // You can add more stats here, like snippet count
      const stats = {
        uid: user.uid,
        email: user.email,
        memberSince: user.createdAt,
        lastLogin: user.lastLoginAt,
        // Add snippet count if needed:
        // snippetCount: await snippetModel.countByUserId(uid)
      };

      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Delete user and all associated data
  async deleteUser(uid) {
    try {
      const result = await User.deleteOne({ uid });
      return result.deletedCount > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserModel();
