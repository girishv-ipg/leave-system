const express = require("express");
const multer = require("multer");
const { ObjectId } = require("mongodb");
const authenticate = require("../middleware/authenticate"); // reuse existing
const { getDb } = require("../lib/mongo"); // reuse existing connection
const expenseController = require("../controllers/travelExpense");

const router = express.Router();

// Simple multer setup - store in memory, convert to base64
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 }, // 1MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and PDF files are allowed"), false);
    }
  },
});

// Routes
router.post(
  "/api/expenses",
  authenticate,
  upload.single("receipt"),
  expenseController.submitExpense
);
router.get("/api/expenses", authenticate, expenseController.getExpenses);
router.get("/api/expenses/:id", authenticate, expenseController.getExpenseById);
router.patch(
  "/api/expenses/:id/status",
  authenticate,
  expenseController.updateExpenseStatus
);

module.exports = router;
