const express = require("express");
const multer = require("multer");
const authenticate = require("../middleware/authenticate"); // reuse existing
const expenseController = require("../controllers/travelExpense");
const router = express.Router();

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

// ADD this new single file upload configuration
const singleUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, and PDF files are allowed."
        )
      );
    }
  },
});

// Routes
router.post(
  "/expenses/bulk-submit",
  authenticate,
  bulkUpload.any(), // Keep this for bulk upload
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

// FIXED: Use singleUpload.single('file') instead of bulkUpload.any()
router.put(
  "/expenses/:id",
  authenticate,
  singleUpload.single("file"), // This is the fix
  expenseController.updateExpense
);

// Manager review routes
router.patch(
  "/expenses/:id/manager-review",
  authenticate,
  expenseController.managerReviewExpense
);
router.patch(
  "/bulk-submissions/:id/manager-review",
  authenticate,
  expenseController.managerBulkReview
);

// Finance review routes
router.patch(
  "/expenses/:id/finance-review",
  authenticate,
  expenseController.financeReviewExpense
);
router.patch(
  "/bulk-submissions/:id/finance-review",
  authenticate,
  expenseController.financeBulkReview
);

module.exports = router;
