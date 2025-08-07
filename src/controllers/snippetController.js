const snippetModel = require("../models/snippetModel");

/**
 * Get all snippets for the authenticated user
 * GET /api/snippets
 */
const getAllSnippets = async (req, res) => {
  try {
    const userId = req.user.uid;

    const snippets = await snippetModel.getAllByUserId(userId);

    res.json({
      success: true,
      snippets,
    });
  } catch (error) {
    console.error("Error fetching snippets:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch snippets",
    });
  }
};

/**
 * Create a new snippet
 * POST /api/snippets
 */
const createSnippet = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { keyword, value, usageCount = 0, lastUsed = null } = req.body;

    // Validation
    if (!keyword || !value) {
      return res.status(400).json({
        success: false,
        error: "Keyword and value are required",
      });
    }

    if (typeof keyword !== "string" || typeof value !== "string") {
      return res.status(400).json({
        success: false,
        error: "Keyword and value must be strings",
      });
    }

    if (!keyword.startsWith("/")) {
      return res.status(400).json({
        success: false,
        error: "Keyword must start with /",
      });
    }

    if (keyword.length < 1) {
      return res.status(400).json({
        success: false,
        error: "Keyword must be at least 1 characters long",
      });
    }

    if (value.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Value cannot be empty",
      });
    }

    // Create the snippet
    const snippet = await snippetModel.create(userId, {
      keyword: keyword.trim(),
      value,
      usageCount,
      lastUsed,
    });

    res.status(201).json({
      success: true,
      snippet,
    });
  } catch (error) {
    console.error("Error creating snippet:", error);

    // Handle duplicate keyword error
    if (error.code === "DUPLICATE_KEYWORD") {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: "A snippet with this keyword already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create snippet",
    });
  }
};

/**
 * Delete a snippet
 * DELETE /api/snippets/:id
 */
const deleteSnippet = async (req, res) => {
  try {
    const userId = req.user.uid;
    const snippetId = req.params.id;

    if (!snippetId) {
      return res.status(400).json({
        success: false,
        error: "Snippet ID is required",
      });
    }

    // Check if snippet exists and belongs to user
    const snippet = await snippetModel.findByIdAndUserId(snippetId, userId);

    if (!snippet) {
      return res.status(404).json({
        success: false,
        error: "Snippet not found",
      });
    }

    // Delete the snippet
    const deleted = await snippetModel.deleteByIdAndUserId(snippetId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "Snippet not found",
      });
    }

    res.json({
      success: true,
      message: "Snippet deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting snippet:", error);

    // Handle invalid ObjectId error
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid snippet ID",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to delete snippet",
    });
  }
};

/**
 * Increment usage count for a snippet
 * POST /api/snippets/:id/usage
 */
const incrementUsage = async (req, res) => {
  try {
    const userId = req.user.uid;
    const snippetId = req.params.id;

    if (!snippetId) {
      return res.status(400).json({
        success: false,
        error: "Snippet ID is required",
      });
    }

    // Increment usage count
    const result = await snippetModel.incrementUsage(snippetId, userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Snippet not found",
      });
    }

    res.json({
      success: true,
      usageCount: result.usageCount,
      lastUsed: result.lastUsed,
    });
  } catch (error) {
    console.error("Error incrementing usage:", error);

    // Handle invalid ObjectId error
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid snippet ID",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to increment usage count",
    });
  }
};

/**
 * Get a specific snippet by ID
 * GET /api/snippets/:id
 */
const getSnippetById = async (req, res) => {
  try {
    const userId = req.user.uid;
    const snippetId = req.params.id;

    if (!snippetId) {
      return res.status(400).json({
        success: false,
        error: "Snippet ID is required",
      });
    }

    const snippet = await snippetModel.findByIdAndUserId(snippetId, userId);

    if (!snippet) {
      return res.status(404).json({
        success: false,
        error: "Snippet not found",
      });
    }

    res.json({
      success: true,
      snippet,
    });
  } catch (error) {
    console.error("Error fetching snippet:", error);

    // Handle invalid ObjectId error
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid snippet ID",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch snippet",
    });
  }
};

/**
 * Update a snippet
 * PUT /api/snippets/:id
 */
const updateSnippet = async (req, res) => {
  try {
    const userId = req.user.uid;
    const snippetId = req.params.id;
    const { keyword, value } = req.body;

    if (!snippetId) {
      return res.status(400).json({
        success: false,
        error: "Snippet ID is required",
      });
    }

    // Validation
    if (!keyword || !value) {
      return res.status(400).json({
        success: false,
        error: "Keyword and value are required",
      });
    }

    if (typeof keyword !== "string" || typeof value !== "string") {
      return res.status(400).json({
        success: false,
        error: "Keyword and value must be strings",
      });
    }

    if (!keyword.startsWith("/")) {
      return res.status(400).json({
        success: false,
        error: "Keyword must start with /",
      });
    }

    // Check if snippet exists
    const existingSnippet = await snippetModel.findByIdAndUserId(
      snippetId,
      userId
    );

    if (!existingSnippet) {
      return res.status(404).json({
        success: false,
        error: "Snippet not found",
      });
    }

    // If keyword is being changed, check for duplicates
    if (keyword !== existingSnippet.keyword) {
      const duplicateExists = await snippetModel.findByKeywordAndUserId(
        keyword.trim(),
        userId
      );
      if (duplicateExists) {
        return res.status(409).json({
          success: false,
          error: "A snippet with this keyword already exists",
        });
      }
    }

    // Update using delete and create (simple approach)
    await snippetModel.deleteByIdAndUserId(snippetId, userId);
    const updatedSnippet = await snippetModel.create(userId, {
      keyword: keyword.trim(),
      value,
      usageCount: existingSnippet.usageCount,
      lastUsed: existingSnippet.lastUsed,
    });

    res.json({
      success: true,
      snippet: updatedSnippet,
    });
  } catch (error) {
    console.error("Error updating snippet:", error);

    // Handle invalid ObjectId error
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid snippet ID",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update snippet",
    });
  }
};

module.exports = {
  getAllSnippets,
  createSnippet,
  deleteSnippet,
  incrementUsage,
  getSnippetById,
  updateSnippet,
};
