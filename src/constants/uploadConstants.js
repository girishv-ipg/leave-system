// constants/uploadConstants.js

/**
 * File constraints for uploads
 */
export const UPLOAD_FILE_CONSTRAINTS = {
  maxSize: 1 * 1024 * 1024, // 1MB
  allowedTypes: ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".pdf"],
};

/**
 * Initial expense template
 */
export const getInitialExpense = () => ({
  id: Date.now() + Math.random(),
  expenseType: "travel",
  amount: "",
  description: "",
  travelStartDate: new Date().toISOString().split("T")[0],
  travelEndDate: new Date().toISOString().split("T")[0],
  purpose: "",
  attendees: "",
  file: null,
  fileName: "",
  existingFile: false,
});

/**
 * Instructions for new submission
 */
export const NEW_SUBMISSION_INSTRUCTIONS = [
  "Fill in all the required fields for each expense entry",
  "Upload receipts in JPG, PNG, JPEG or PDF format (max 1MB each)",
  "Ensure travel end date is not before start date",
  "Use Add New Expense to add more entries to the table",
];
