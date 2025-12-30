// constants/expenseConstants.js

/**
 * Available expense types
 */
export const EXPENSE_TYPES = [
  "travel",
  "accommodation",
  "lunch",
  "breakfast",
  "dinner",
  "meals",
  "transport",
  "office_supplies",
  "training",
  "other",
];

/**
 * File upload constraints
 */
export const FILE_CONSTRAINTS = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ],
  allowedExtensions: ["jpg", "jpeg", "png", "pdf"],
};

/**
 * Status colors for different expense states
 */
export const STATUS_COLORS = {
  approved: {
    main: "#1a7f37",
    bg: "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
    border: "#1a7f3720",
  },
  rejected: {
    main: "#cf222e",
    bg: "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)",
    border: "#cf222e20",
  },
  pending: {
    main: "#bf8700",
    bg: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
    border: "#bf870020",
  },
  managerApproved: {
    main: "#0ea5e9",
    bg: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
    border: "#0ea5e920",
  },
};

/**
 * Summary stats configuration for employee view
 */
export const EMPLOYEE_SUMMARY_STATS = [
  {
    key: "total",
    label: "Total",
    icon: "RequestQuote",
    color: "#0969da",
    bg: "linear-gradient(135deg, #dbeafe 0%, #f0f9ff 100%)",
  },
  {
    key: "approved",
    label: "Approved",
    icon: "CheckCircle",
    color: "#1a7f37",
    bg: "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
  },
  {
    key: "managerApproved",
    label: "Manager Approved",
    icon: "SupervisorAccount",
    color: "#0ea5e9",
    bg: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
  },
  {
    key: "pending",
    label: "Pending",
    icon: "Schedule",
    color: "#bf8700",
    bg: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
  },
  {
    key: "rejected",
    label: "Rejected",
    icon: "Cancel",
    color: "#cf222e",
    bg: "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)",
  },
];

/**
 * Employee tab configuration
 */
export const EMPLOYEE_TABS = [
  {
    value: "all",
    label: "All Expenses",
    icon: "Assessment",
    color: "primary",
  },
  {
    value: "pending",
    label: "Pending",
    icon: "Schedule",
    color: "warning",
  },
  {
    value: "managerApproved",
    label: "Manager Approved",
    icon: "SupervisorAccount",
    color: "info",
  },
  {
    value: "approved",
    label: "Approved",
    icon: "CheckCircle",
    color: "success",
  },
  {
    value: "rejected",
    label: "Rejected",
    icon: "Cancel",
    color: "error",
  },
];

/**
 * Get tabs based on user role
 */
export const getTabsByRole = (role) => {
  if (role === "finance") {
    return [
      {
        value: "managerApproved",
        label: "Pending Review",
        icon: "Schedule",
        color: "warning",
      },
      {
        value: "approved",
        label: "Fully Approved",
        icon: "CheckCircle",
        color: "success",
      },
      {
        value: "rejected",
        label: "Rejected",
        icon: "Cancel",
        color: "error",
      },
    ];
  } else if (role === "manager") {
    return [
      { value: "all", label: "All", icon: "Assessment", color: "primary" },
      {
        value: "myExpenses",
        label: "My Expenses",
        icon: "Person",
        color: "secondary",
      },
      {
        value: "pending",
        label: "Pending",
        icon: "Schedule",
        color: "warning",
      },
      {
        value: "managerApproved",
        label: "Manager Approved",
        icon: "SupervisorAccount",
        color: "info",
      },
      {
        value: "approved",
        label: "Fully Approved",
        icon: "CheckCircle",
        color: "success",
      },
      {
        value: "rejected",
        label: "Rejected",
        icon: "Cancel",
        color: "error",
      },
    ];
  } else {
    // Default for admin
    return [
      { value: "all", label: "All", icon: "Assessment", color: "primary" },
      {
        value: "pending",
        label: "Pending",
        icon: "Schedule",
        color: "warning",
      },
      {
        value: "managerApproved",
        label: "Manager Approved",
        icon: "SupervisorAccount",
        color: "info",
      },
      {
        value: "approved",
        label: "Fully Approved",
        icon: "CheckCircle",
        color: "success",
      },
      {
        value: "rejected",
        label: "Rejected",
        icon: "Cancel",
        color: "error",
      },
    ];
  }
};