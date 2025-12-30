// services/uploadService.js

import axiosInstance, { base64ToFile } from "@/utils/helpers";

/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication required. Please login again.");
  }
  return token;
};

/**
 * Get authorization headers
 */
const getAuthHeaders = () => ({
  Authorization: `Bearer ${getAuthToken()}`,
});

/**
 * Create FormData for bulk expense submission
 * @param {Array} expenses - Array of expense objects
 * @returns {FormData} Prepared FormData object
 */
export const createBulkExpenseFormData = (expenses) => {
  const formData = new FormData();

  const expensesToSubmit = expenses.map((expense, index) => {
    // Use the correct field names that match your backend
    const expenseData = {
      expenseType: expense.expenseType,
      amount: parseFloat(expense.amount),
      description: expense.description,
      startDate: expense.travelStartDate,  // Map travelStartDate to startDate
      endDate: expense.travelEndDate,      // Map travelEndDate to endDate
      attendees: expense.attendees || "",   // Ensure attendees is not undefined
      purpose: expense.purpose || "",       // Ensure purpose is not undefined
      hasFile: !!expense.file,
      fileIndex: expense.file ? index : null,
    };

    // Add file to FormData if present
    if (expense.file) {
      formData.append("files", expense.file);
    }

    return expenseData;
  });

  // Add expenses data as JSON string
  formData.append("expenses", JSON.stringify(expensesToSubmit));

  return formData;
};

/**
 * Submit bulk expenses
 * @param {Array} expenses - Array of expense objects
 * @returns {Promise<Object>} API response
 */
export const submitBulkExpenses = async (expenses) => {
  try {
    const token = getAuthToken();
    const formData = createBulkExpenseFormData(expenses);

    const response = await axiosInstance.post("/expenses", formData, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
      timeout: 50000, // 50 seconds for bulk upload
    });

    return response.data;
  } catch (error) {
    // Handle different error types
    if (error.response) {
      const status = error.response.status;
      const errorMessage =
        error.response.data?.error ||
        error.response.data?.message ||
        "Server error occurred";

      if (status === 413) {
        throw new Error(
          "Request too large. Please reduce file sizes or submit fewer expenses at once."
        );
      } else if (status === 401) {
        throw new Error("Session expired. Please login again.");
      } else {
        throw new Error(errorMessage);
      }
    } else if (error.request) {
      throw new Error("Network error. Please check your connection and try again.");
    } else if (error.code === "ECONNABORTED") {
      throw new Error(
        "Request timeout. Please try again with fewer expenses or smaller files."
      );
    } else {
      throw new Error(
        error.message || "Something went wrong while submitting expenses"
      );
    }
  }
};

/**
 * Save draft expenses
 * @param {Array} expenses - Array of expense objects
 * @returns {Promise<void>}
 */
export const saveDraftExpenses = async (expenses) => {
  try {
    const token = getAuthToken();
    const formData = createBulkExpenseFormData(expenses);
    
    await axiosInstance.post("/expenses/draft", formData, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });
  } catch (error) {
    console.error("Save draft error:", error);
    const errorMessage = 
      error.response?.data?.error || 
      error.response?.data?.message || 
      "Failed to save draft";
    throw new Error(errorMessage);
  }
};

/**
 * Fetch draft expenses
 * @returns {Promise<Array>} Array of restored expense objects
 */
export const fetchDraftExpenses = async () => {
  try {
    const token = getAuthToken();
    const res = await axiosInstance.get("/expenses/draft", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const draftExpenses = res.data?.data?.expenses || [];

    if (!draftExpenses.length) return [];

    return draftExpenses.map((exp) => {
      // Restore first file if exists
      let restoredFile = null;
      let restoredFileName = "";

      if (exp.files?.length) {
        const file = exp.files[0];

        try {
          restoredFile = base64ToFile(file.data, file.name, file.type);
          restoredFileName = file.name;
        } catch (err) {
          console.error("Failed to restore file:", err);
        }
      }

      return {
        id: Date.now() + Math.random(),
        expenseType: exp.expenseType,
        amount: exp.amount?.toString() || "",
        description: exp.description || "",
        attendees: exp.attendees || "",
        purpose: exp.purpose || "",
        travelStartDate: exp.startDate
          ? new Date(exp.startDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        travelEndDate: exp.endDate
          ? new Date(exp.endDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        file: restoredFile,
        fileName: restoredFileName,
        existingFile: !!restoredFileName,
      };
    });
  } catch (err) {
    console.error("Error loading draft:", err);
    return [];
  }
};

/**
 * Validate all expenses before submission
 * @param {Array} expenses - Array of expense objects
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateExpenses = (expenses) => {
  if (!expenses || expenses.length === 0) {
    return { valid: false, error: "Please add at least one expense" };
  }

  for (let i = 0; i < expenses.length; i++) {
    const expense = expenses[i];
    const rowNum = i + 1;

    // Check required fields
    if (!expense.expenseType) {
      return {
        valid: false,
        error: `Row ${rowNum}: Please select an expense type`,
      };
    }

    if (!expense.amount || expense.amount.trim() === "") {
      return {
        valid: false,
        error: `Row ${rowNum}: Please enter an amount`,
      };
    }

    if (!expense.description || expense.description.trim() === "") {
      return {
        valid: false,
        error: `Row ${rowNum}: Please enter a description`,
      };
    }

    if (!expense.purpose || expense.purpose.trim() === "") {
      return {
        valid: false,
        error: `Row ${rowNum}: Please enter a purpose`,
      };
    }

    if (!expense.attendees || expense.attendees.trim() === "") {
      return {
        valid: false,
        error: `Row ${rowNum}: Please enter attendees`,
      };
    }

    // Validate amount is a valid number
    const amount = parseFloat(expense.amount);
    if (isNaN(amount) || amount <= 0) {
      return { 
        valid: false, 
        error: `Row ${rowNum}: Please enter a valid amount greater than 0` 
      };
    }

    // Validate dates
    if (!expense.travelStartDate) {
      return {
        valid: false,
        error: `Row ${rowNum}: Please enter a start date`,
      };
    }

    if (!expense.travelEndDate) {
      return {
        valid: false,
        error: `Row ${rowNum}: Please enter an end date`,
      };
    }

    if (new Date(expense.travelStartDate) > new Date(expense.travelEndDate)) {
      return {
        valid: false,
        error: `Row ${rowNum}: End date cannot be before start date`,
      };
    }

    // Validate file size if file exists
    if (expense.file) {
      const fileSizeMB = expense.file.size / 1024 / 1024;
      if (fileSizeMB > 1) {
        return {
          valid: false,
          error: `Row ${rowNum}: File size must be less than 1MB (current: ${fileSizeMB.toFixed(2)}MB)`,
        };
      }
    }
  }

  return { valid: true, error: null };
};

/**
 * Calculate total amount from expenses
 * @param {Array} expenses - Array of expense objects
 * @returns {number} Total amount
 */
export const calculateTotalAmount = (expenses) => {
  return expenses.reduce((total, expense) => {
    const amount = parseFloat(expense.amount) || 0;
    return total + amount;
  }, 0);
};