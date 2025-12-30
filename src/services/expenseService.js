// services/expenseService.js

import axiosInstance from "../utils/helpers";

/**
 * Get authentication token from localStorage
 */
const getAuthToken = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Please login first");
  }
  return token;
};

/**
 * Get authorization headers
 */
const getAuthHeaders = () => {
  return {
    Authorization: `Bearer ${getAuthToken()}`,
  };
};

/**
 * Fetch expenses for employee
 * @returns {Promise<Array>} Array of expense submissions
 */
export const fetchEmployeeExpenses = async () => {
  try {
    const response = await axiosInstance.get("/expenses/employee", {
      headers: getAuthHeaders(),
    });
    return response?.data?.data || [];
  } catch (error) {
    console.error("Error fetching employee expenses:", error);
    throw new Error(
      error.response?.data?.error || "Failed to fetch expenses"
    );
  }
};

/**
 * Fetch all expenses (admin/manager/finance)
 * @returns {Promise<Array>} Array of expense submissions
 */
export const fetchAllExpenses = async () => {
  try {
    const response = await axiosInstance.get("/expenses", {
      headers: getAuthHeaders(),
    });
    return response?.data?.data || [];
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw new Error(
      error.response?.data?.error || "Failed to fetch expenses"
    );
  }
};

/**
 * Update an expense
 * @param {string} submissionId - Bulk submission ID
 * @param {string} expenseId - Expense ID
 * @param {FormData} formData - Form data with expense details
 * @returns {Promise<Object>} Updated expense data
 */
export const updateExpense = async (submissionId, expenseId, formData) => {
  try {
    const response = await axiosInstance.put(
      `/expenses/${submissionId}/expense/${expenseId}`,
      formData,
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating expense:", error);
    throw new Error(
      error.response?.data?.error || "Failed to update expense"
    );
  }
};

/**
 * Manager review - Approve/Reject entire submission
 * @param {string} submissionId - Bulk submission ID
 * @param {string} action - "managerApproved" or "rejected"
 * @param {string} comments - Admin comments
 * @returns {Promise<Object>} Review response
 */
export const managerReview = async (submissionId, action, comments) => {
  try {
    const response = await axiosInstance.patch(
      `/expenses/${submissionId}/manager-review`,
      {
        action,
        adminComments: comments,
      },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error in manager review:", error);
    throw new Error(
      error.response?.data?.error || "Failed to process manager review"
    );
  }
};

/**
 * Finance review - Approve/Reject individual expense
 * @param {string} submissionId - Bulk submission ID
 * @param {string} expenseId - Expense ID
 * @param {string} action - "approved" or "rejected"
 * @param {string} comments - Finance comments
 * @returns {Promise<Object>} Review response
 */
export const financeReview = async (
  submissionId,
  expenseId,
  action,
  comments
) => {
  try {
    const response = await axiosInstance.patch(
      `/expenses/${submissionId}/expense/${expenseId}/finance-review`,
      {
        action,
        adminComments: comments,
      },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error in finance review:", error);
    throw new Error(
      error.response?.data?.error || "Failed to process finance review"
    );
  }
};

/**
 * Create form data from expense object
 * @param {Object} expenseData - Expense data object
 * @param {File} file - Optional file to upload
 * @returns {FormData} Form data object
 */
export const createExpenseFormData = (expenseData, file = null) => {
  const formData = new FormData();

  Object.entries(expenseData).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      formData.append(key, value);
    }
  });

  if (file) {
    formData.append("file", file);
  }

  return formData;
};

/**
 * Filter expenses by status
 * @param {Array} expenses - Array of expense submissions
 * @param {string} status - Status to filter by
 * @param {string} userId - Current user ID (for myExpenses filter)
 * @returns {Array} Filtered expenses
 */
export const filterExpensesByStatus = (expenses, status, userId = null) => {
  if (status === "all") {
    return expenses;
  }

  if (status === "myExpenses" && userId) {
    return expenses.filter((exp) => exp.employeeId === userId);
  }

  switch (status) {
    case "pending":
      return expenses.filter((exp) => exp.status === "pending");
    case "rejected":
      return expenses.filter((exp) => exp.status === "rejected");
    case "managerApproved":
      return expenses.filter(
        (exp) =>
          exp.isManagerApproved &&
          !exp.isFinanceApproved &&
          exp.status !== "rejected"
      );
    case "approved":
      return expenses.filter((exp) => exp.status === "approved");
    default:
      return expenses;
  }
};

/**
 * Check if user can edit an expense
 * @param {Object} expense - Expense object
 * @param {Object} submission - Submission object
 * @param {string} userId - Current user ID
 * @returns {boolean} Whether user can edit
 */
export const canEditExpense = (expense, submission, userId) => {
  return (
    submission.employeeId === userId &&
    (expense.status === "pending" || expense.status === "rejected")
  );
};

/**
 * Check if user can perform bulk action on submission
 * @param {Object} submission - Submission object
 * @param {string} userRole - Current user role
 * @returns {boolean} Whether user can perform bulk action
 */
export const canPerformBulkAction = (submission, userRole) => {
  if (userRole === "manager") {
    return submission.expenses.every((exp) => exp.status === "pending");
  } else if (userRole === "finance") {
    return submission.expenses.every(
      (exp) => exp.status === "managerApproved"
    );
  }
  return false;
};

/**
 * Check if user can act on individual expense
 * @param {Object} expense - Expense object
 * @param {string} userRole - Current user role
 * @returns {boolean} Whether user can act on expense
 */
export const canActOnExpense = (expense, userRole) => {
  if (userRole === "manager") {
    return false; // Managers only do bulk actions
  } else if (userRole === "finance" || userRole === "admin") {
    return (
      expense.status === "managerApproved" || expense.status === "pending"
    );
  }
  return false;
};