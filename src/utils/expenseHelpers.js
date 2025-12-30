// utils/expenseHelpers.js

/**
 * Get status color based on expense status
 */
export const getStatusColor = (status) => {
  const colors = {
    approved: "success",
    rejected: "error",
    pending: "warning",
    managerApproved: "info",
  };
  return colors[status] || "default";
};

/**
 * Get overall submission status from expenses array
 */
export const getSubmissionStatus = (expenses) => {
  const statuses = expenses?.map((exp) => exp.status);
  if (statuses.every((status) => status === "approved")) return "approved";
  if (statuses.some((status) => status === "rejected")) return "rejected";
  if (statuses.some((status) => status === "managerApproved"))
    return "managerApproved";
  return "pending";
};

/**
 * Get count of expenses by status
 */
export const getStatusCounts = (expenses) => {
  return expenses?.reduce((acc, exp) => {
    acc[exp.status] = (acc[exp.status] || 0) + 1;
    return acc;
  }, {});
};

/**
 * Calculate totals from submissions
 */
export const calculateTotals = (submissions) => {
  const allExpenses = submissions?.flatMap((submission) => submission.expenses);
  return allExpenses?.reduce(
    (acc, expense) => {
      const amount = parseFloat(expense.amount) || 0;
      acc.total += amount;
      acc[expense.status] = (acc[expense.status] || 0) + amount;
      return acc;
    },
    { total: 0, approved: 0, pending: 0, rejected: 0, managerApproved: 0 }
  );
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Get file icon based on extension
 */
export const getFileIcon = (fileName, IconComponents) => {
  const { Description, FilePresent } = IconComponents;
  const extension = fileName?.split(".").pop()?.toLowerCase();
  return extension === "pdf" ? <Description /> : <FilePresent />;
};

/**
 * Validate file for upload
 */
export const validateFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];

  if (file.size > maxSize) {
    return { valid: false, error: "File size must be less than 10MB" };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Only JPEG, PNG, and PDF files are allowed" };
  }

  return { valid: true, error: null };
};

/**
 * Normalize string for filtering
 */
export const normalize = (s) => (s || "").toString().trim().toLowerCase();

/**
 * Check if date matches year
 */
export const matchesYear = (d, year) => {
  if (!year || !d) return true;
  const nd = new Date(d);
  if (isNaN(nd)) return false;
  return nd.getFullYear() === Number(year);
};

/**
 * Check if date matches month
 */
export const matchesMonth = (d, month) => {
  if (!month || !d) return true;
  const nd = new Date(d);
  if (isNaN(nd)) return false;
  return nd.getMonth() + 1 === Number(month);
};

/**
 * Check if date is in range
 */
export const dateInRangeOrEqual = (theDate, start, end) => {
  if (!theDate || !start || !end) return false;
  const d = new Date(theDate);
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(d) || isNaN(s) || isNaN(e)) return false;
  return d >= s && d <= e;
};

/**
 * Get user initials from name
 */
export const getUserInitials = (name) => {
  if (!name) return "E";
  const parts = name.trim().split(/\s+/);
  return (
    parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")
  ).toUpperCase();
};

/**
 * Sanitize filename for export
 */
export const safeFilename = (s) =>
  (s || "")
    .toString()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 80);

/**
 * Get file extension from name or mime type
 */
export const getExtension = (name, type) => {
  if (name && name.includes(".")) return name.split(".").pop();
  if (!type) return "bin";
  if (type.includes("pdf")) return "pdf";
  if (type.includes("png")) return "png";
  if (type.includes("jpeg")) return "jpg";
  if (type.includes("jpg")) return "jpg";
  if (type.includes("gif")) return "gif";
  if (type.includes("webp")) return "webp";
  return type.split("/").pop() || "bin";
};