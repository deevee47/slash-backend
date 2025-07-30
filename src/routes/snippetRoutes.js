const express = require("express");
const snippetController = require("../controllers/snippetController");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Apply authentication middleware to all snippet routes
router.use(verifyToken);

// GET /api/snippets - Get all snippets for authenticated user
router.get("/", snippetController.getAllSnippets);

// POST /api/snippets - Create a new snippet
router.post("/", snippetController.createSnippet);

// GET /api/snippets/:id - Get a specific snippet by ID
router.get("/:id", snippetController.getSnippetById);

// PUT /api/snippets/:id - Update a snippet
router.put("/:id", snippetController.updateSnippet);

// DELETE /api/snippets/:id - Delete a snippet
router.delete("/:id", snippetController.deleteSnippet);

// POST /api/snippets/:id/usage - Increment usage count
router.post("/:id/usage", snippetController.incrementUsage);

module.exports = router;
