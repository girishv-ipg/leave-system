// ./server/routes/travelExpense.js
const express = require("express");
const multer = require("multer");
const authenticate = require("../middleware/authenticate");
const expenseController = require("../controllers/travelExpense");
const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
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

// Draft routes
router.get(
  "/expenses/draft",
  authenticate,
  expenseController.getDraftExpense
);

router.post(
  "/expenses/draft",
  authenticate,
  upload.any(),
  expenseController.saveDraftExpense
);


// Employee routes
router.post(
  "/expenses",
  authenticate,
  upload.any(),
  expenseController.createExpense
);
router.get(
  "/expenses/employee",
  authenticate,
  expenseController.getEmployeeExpenses
);
router.put(
  "/expenses/:id/expense/:expenseId",
  authenticate,
  upload.any(),
  expenseController.updateExpense
);
router.delete("/expenses/:id", authenticate, expenseController.deleteExpense);

// Admin/Manager/Finance routes
router.get("/expenses", authenticate, expenseController.getAllExpenses);
router.get("/expenses/:id", authenticate, expenseController.getExpenseById);
router.get(
  "/expenses/:id/file",
  authenticate,
  expenseController.getExpenseFile
);

// Manager review
router.patch(
  "/expenses/:id/manager-review",
  authenticate,
  expenseController.managerReviewExpense
);

// Finance review
router.patch(
  "/expenses/:id/expense/:expenseId/finance-review",
  authenticate,
  expenseController.financeReviewExpense
);



module.exports = router;
