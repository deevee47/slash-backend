const mongoose = require("mongoose");

// Snippet Schema
const snippetSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    keyword: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUsed: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Compound index to ensure unique keyword per user
snippetSchema.index({ userId: 1, keyword: 1 }, { unique: true });

// Create the model
const Snippet = mongoose.model("Snippet", snippetSchema);

class SnippetModel {
  // Get all snippets for a user
  async getAllByUserId(userId) {
    try {
      const snippets = await Snippet.find({ userId })
        .sort({ updatedAt: -1 })
        .lean();

      return snippets.map((snippet) => ({
        id: snippet._id.toString(),
        keyword: snippet.keyword,
        value: snippet.value,
        usageCount: snippet.usageCount,
        lastUsed: snippet.lastUsed,
        createdAt: snippet.createdAt,
        updatedAt: snippet.updatedAt,
      }));
    } catch (error) {
      throw error;
    }
  }

  // Create a new snippet
  async create(userId, snippetData) {
    try {
      const { keyword, value, usageCount = 0, lastUsed = null } = snippetData;

      const snippet = new Snippet({
        userId,
        keyword,
        value,
        usageCount,
        lastUsed,
      });

      const savedSnippet = await snippet.save();

      return {
        id: savedSnippet._id.toString(),
        keyword: savedSnippet.keyword,
        value: savedSnippet.value,
        usageCount: savedSnippet.usageCount,
        lastUsed: savedSnippet.lastUsed,
        createdAt: savedSnippet.createdAt,
        updatedAt: savedSnippet.updatedAt,
      };
    } catch (error) {
      // Handle duplicate key error
      if (error.code === 11000) {
        const duplicateError = new Error(
          "A snippet with this keyword already exists"
        );
        duplicateError.code = "DUPLICATE_KEYWORD";
        throw duplicateError;
      }
      throw error;
    }
  }

  // Find snippet by ID and user ID
  async findByIdAndUserId(snippetId, userId) {
    try {
      const snippet = await Snippet.findOne({
        _id: snippetId,
        userId,
      }).lean();

      if (!snippet) {
        return null;
      }

      return {
        id: snippet._id.toString(),
        keyword: snippet.keyword,
        value: snippet.value,
        usageCount: snippet.usageCount,
        lastUsed: snippet.lastUsed,
        createdAt: snippet.createdAt,
        updatedAt: snippet.updatedAt,
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete a snippet
  async deleteByIdAndUserId(snippetId, userId) {
    try {
      const result = await Snippet.deleteOne({
        _id: snippetId,
        userId,
      });

      return result.deletedCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // Increment usage count
  async incrementUsage(snippetId, userId) {
    try {
      const currentTime = new Date();

      const result = await Snippet.findOneAndUpdate(
        { _id: snippetId, userId },
        {
          $inc: { usageCount: 1 },
          lastUsed: currentTime,
        },
        { new: true }
      ).lean();

      if (!result) {
        return null;
      }

      return {
        usageCount: result.usageCount,
        lastUsed: result.lastUsed,
      };
    } catch (error) {
      throw error;
    }
  }

  // Check if keyword exists for user (for duplicate prevention)
  async findByKeywordAndUserId(keyword, userId) {
    try {
      const snippet = await Snippet.findOne({
        keyword,
        userId,
      }).select("_id");

      return !!snippet;
    } catch (error) {
      throw error;
    }
  }

  // Get snippet by keyword and user ID (useful for updates)
  async findByKeywordAndUserIdFull(keyword, userId) {
    try {
      const snippet = await Snippet.findOne({
        keyword,
        userId,
      }).lean();

      if (!snippet) {
        return null;
      }

      return {
        id: snippet._id.toString(),
        keyword: snippet.keyword,
        value: snippet.value,
        usageCount: snippet.usageCount,
        lastUsed: snippet.lastUsed,
        createdAt: snippet.createdAt,
        updatedAt: snippet.updatedAt,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new SnippetModel();
