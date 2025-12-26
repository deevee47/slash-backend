const mongoose = require("mongoose");
const auditModel = require("./auditModel");

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

/**
 * Find user by MongoDB _id
 */
const findById = async (userId) => {
  try {
    const user = await User.findById(userId).lean();

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      firebaseUid: user.uid,
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
};

/**
 * Find user by Firebase UID
 */
const findByUid = async (uid) => {
  try {
    const user = await User.findOne({ uid }).lean();

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
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
};

/**
 * Create or update user (upsert)
 */
const syncUser = async (userData) => {
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

    // Create audit log for user sync
    await auditModel.createAuditLog({
      userId: uid,
      userEmail: email,
      userName: displayName,
      action: "user_sync",
      resource: "user",
      resourceId: uid,
      method: "POST",
      url: "/api/user/sync",
      status: "success",
      statusCode: 200,
      details: {
        operation: "upsert",
        email: email,
        displayName: displayName,
      },
      requestBody: userData,
      responseData: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
    });

    return {
      id: user._id.toString(),
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
};

/**
 * Update last login time
 */
const updateLastLogin = async (uid) => {
  try {
    const user = await User.findOneAndUpdate(
      { uid },
      { lastLoginAt: new Date() },
      { new: true }
    ).lean();

    if (!user) {
      return null;
    }

    // Create audit log for login update
    await auditModel.createAuditLog({
      userId: uid,
      userEmail: user.email,
      userName: user.displayName,
      action: "update_last_login",
      resource: "user",
      resourceId: uid,
      method: "PUT",
      url: "/api/user/login",
      status: "success",
      statusCode: 200,
      details: {
        operation: "update",
        lastLoginAt: user.lastLoginAt,
      },
      responseData: {
        lastLoginAt: user.lastLoginAt,
      },
    });

    return {
      id: user._id.toString(),
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
};

/**
 * Get user statistics
 */
const getUserStats = async (uid) => {
  try {
    const user = await findByUid(uid);
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
};

/**
 * Delete user and all associated data
 */
const deleteUser = async (uid) => {
  try {
    const result = await User.deleteOne({ uid });
    //TODO: Delete all snippets associated with the user

    if (result.deletedCount > 0) {
      // Create audit log for user deletion
      await auditModel.createAuditLog({
        userId: uid,
        action: "delete_user_account",
        resource: "user",
        resourceId: uid,
        method: "DELETE",
        url: "/api/user/account",
        status: "success",
        statusCode: 200,
        details: {
          operation: "delete",
          deletedCount: result.deletedCount,
        },
        responseData: {
          message: "User account deleted successfully",
        },
      });
    }

    return result.deletedCount > 0;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  findById,
  findByUid,
  syncUser,
  updateLastLogin,
  getUserStats,
  deleteUser,
};
