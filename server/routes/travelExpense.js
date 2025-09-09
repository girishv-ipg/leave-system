const express = require("express");
const multer = require("multer");
const { ObjectId } = require("mongodb");
const authenticate = require("../middleware/authenticate"); // reuse existing
const expenseController = require("../controllers/travelExpense");
const router = express.Router();

// Simple multer setup - store in memory, convert to base64
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 50 }, // 50MB limit
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

// Configure multer for bulk file uploads (multiple files)
const bulkUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB per file
    files: 10, // Maximum 10 files
  },
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
  "/expenses/bulk-submit",
  authenticate,
  bulkUpload.any(),
  expenseController.submitBulkExpenses
);
router.get("/expenses", authenticate, expenseController.getExpenses);
router.get(
  "/admin/expenses",
  authenticate,
  expenseController.getExpensesForAdmin
);
router.get("/expenses/:id", authenticate, expenseController.getExpenseById);
router.get(
  "/expenses/:id/fileData",
  authenticate,
  expenseController.getExpenseFile
);
router.patch(
  "/expenses/:id/status",
  authenticate,
  expenseController.updateExpenseStatus
);
router.put(
  "/expenses/:id",
  authenticate,
  bulkUpload.any(),
  expenseController.updateExpense
);

// Manager review routes
router.patch('/expenses/:id/manager-review', authenticate, expenseController.managerReviewExpense);
router.patch('/bulk-submissions/:id/manager-review', authenticate, expenseController.managerBulkReview);

// Finance review routes
router.patch('/expenses/:id/finance-review', authenticate, expenseController.financeReviewExpense);
router.patch('/bulk-submissions/:id/finance-review', authenticate, expenseController.financeBulkReview);


module.exports = router;
