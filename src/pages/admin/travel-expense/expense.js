// src/pages/admin/travel-expense/expense.js
"use client";

import * as XLSX from "xlsx";

import {
  AccountBalance,
  AdminPanelSettings,
  Assessment,
  Cancel,
  CheckCircle,
  Download,
  Edit,
  ExpandLess,
  ExpandMore,
  FileDownload,
  Home,
  Logout,
  MoreVert,
  PendingActions,
  Person,
  Receipt,
  RequestQuote,
  Schedule,
  SupervisorAccount,
  ThumbDown,
  ThumbUp,
  Visibility,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { act, useEffect, useMemo, useState } from "react";

import { CloudUpload } from "@mui/icons-material";
import { Delete } from "@mui/icons-material";
import { Description } from "@mui/icons-material";
import ExpenseFiltersMenu from "@/utils/ExpenseFiltersOthers";
import { FilePresent } from "@mui/icons-material";
import { FolderZip } from "@mui/icons-material";
import JSZip from "jszip";
import axiosInstance from "@/utils/helpers";
import { saveAs } from "file-saver";
import { useRouter } from "next/navigation";

export default function AdminExpenses() {
  const router = useRouter();
  const [bulkSubmissions, setBulkSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // Will be set based on user role
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [actionDialog, setActionDialog] = useState({
    open: false,
    expense: null,
    submission: null,
    action: "",
    type: "individual", // individual or bulk
  });
  const [comments, setComments] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    expenseType: "",
    amount: "",
    description: "",
    startDate: "",
    endDate: "",
    purpose: "",
    attendees: "",
  });
  const [newFile, setNewFile] = useState(null);
  //state for tracking manage expenses
  const [myExpenses, setMyExpenses] = useState([]);

  // Add these helper functions before the return statement

  const handleEditExpense = (expense, submission) => {
    setSelectedExpense(expense);
    setSelectedSubmission(submission);
    setEditFormData({
      expenseType: expense.expenseType || "",
      amount: expense.amount.toString(),
      description: expense.description,
      startDate: expense.startDate,
      endDate: expense.endDate,
      purpose: expense.purpose || "",
      attendees: expense.attendees || "",
    });
    setNewFile(null);
    setEditDialogOpen(true);
  };

  const handleFormChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setNewFile(null);
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];

    if (file.size > maxSize) {
      setError("File size must be less than 10MB");
      event.target.value = "";
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPEG, PNG, and PDF files are allowed");
      event.target.value = "";
      return;
    }

    setNewFile(file);
  };

  const clearFile = () => {
    setNewFile(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName?.split(".").pop()?.toLowerCase();
    return extension === "pdf" ? <Description /> : <FilePresent />;
  };

  const handleSaveExpense = async () => {
    try {
      setEditLoading(true);
      const token = localStorage.getItem("token");

      const formData = new FormData();
      Object.entries(editFormData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (newFile) {
        formData.append("file", newFile);
      }

      const response = await axiosInstance.put(
        `/expenses/${selectedSubmission._id}/expense/${selectedExpense._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.message) {
        handleCloseEditDialog();
        setSuccess("Expense updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
        fetchExpenses(activeTab);
      } else {
        setError("Failed to update expense");
      }
    } catch (err) {
      console.error("Error updating expense:", err);
      setError(
        err.response?.data?.error ||
          "Failed to update expense. Please try again."
      );
      setTimeout(() => setError(""), 4000);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedExpense(null);
    setSelectedSubmission(null);
    setNewFile(null);
    setEditFormData({
      expenseType: "",
      amount: "",
      description: "",
      startDate: "",
      endDate: "",
      purpose: "",
      attendees: "",
    });
  };

  const isFormValid = () => {
    return (
      editFormData.expenseType &&
      editFormData.amount &&
      parseFloat(editFormData.amount) > 0 &&
      editFormData.description &&
      editFormData.startDate &&
      editFormData.endDate &&
      editFormData.purpose &&
      editFormData.attendees &&
      editFormData.startDate <= editFormData.endDate &&
      new Date(editFormData.startDate) <= new Date(editFormData.endDate)
    );
  };

  // Check if current user can edit this expense
  const canEditExpense = (expense, submission) => {
    // Can only edit if:
    // 1. User is the original submitter
    // 2. Expense status is pending or rejected
    return (
      submission.employeeId === currentUser?._id &&
      (expense.status === "pending" || expense.status === "rejected")
    );
  };

  // Menu handlers
  const handleMenuOpen = (event, submission) => {
    setAnchorEl(event.currentTarget);
    setSelectedSubmission(submission);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSubmission(null);
  };

  // Export to Excel function
  const exportToExcel = (submission) => {
    const workbook = XLSX.utils.book_new();

    // Prepare data for Excel
    const excelData = submission.expenses.map((expense, index) => ({
      "S.No": index + 1,
      "Employee Name": submission.employeeName,
      "Employee Code": submission.employeeCode,
      "Expense Type": expense.expenseType,
      "Amount (₹)": parseFloat(expense.amount).toLocaleString(),
      Description: expense.description,
      "Travel Start Date": expense.startDate
        ? new Date(expense.startDate).toLocaleDateString()
        : "",
      "Travel End Date": expense.endDate
        ? new Date(expense.endDate).toLocaleDateString()
        : "",
      Purpose: expense.purpose || "-",
      Attendees: expense.attendees || "-",
      Status: expense.status.charAt(0).toUpperCase() + expense.status.slice(1),
      "Approved At": submission.approvedAt
        ? new Date(submission.approvedAt).toLocaleDateString()
        : "-",
      "Admin Comments": expense.adminComments || "-",
      "Submitted Date": new Date(submission.createdAt).toLocaleDateString(),
      "Is Resubmitted": expense.isResubmitted ? "Yes" : "No",
    }));

    // blank row (gap)
    excelData.push({});
    excelData.push({});

    // Add total amount
    excelData.push({
      "Expense Type": "TOTAL",
      "Amount (₹)": parseFloat(submission.totalAmount).toLocaleString(),
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 8 }, // S.No
      { wch: 20 }, // Employee Name
      { wch: 15 }, // Employee Code
      { wch: 15 }, // Expense Type
      { wch: 12 }, // Amount
      { wch: 30 }, // Description
      { wch: 15 }, // Travel Start Date
      { wch: 15 }, // Travel End Date
      { wch: 20 }, // Purpose
      { wch: 20 }, // Attendees
      { wch: 12 }, // Status
      { wch: 15 }, // Approved By
      { wch: 15 }, // Approved At
      { wch: 25 }, // Admin Comments
      { wch: 15 }, // Submitted Date
      { wch: 15 }, // Is Resubmitted
      { wch: 15 }, // Total Amount
    ];
    worksheet["!cols"] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

    // Generate filename
    const fileName = `${submission.employeeName}_${
      submission.employeeCode
    }_Expenses_${new Date().toLocaleDateString().replace(/\//g, "-")}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, fileName);

    setSuccess(`Excel file downloaded: ${fileName}`);
    setTimeout(() => setSuccess(""), 3000);
    handleMenuClose();
  };

  // Download individual receipt function
  const downloadReceipt = async (expense) => {
    try {
      if (!expense.files || expense.files.length === 0) {
        setError("No receipt found for this expense");
        return;
      }

      const file = expense.files[0];

      // Convert base64 to blob
      const byteCharacters = atob(file.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file.type });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Get file extension from type or name
      const extension =
        file.name?.split(".").pop() ||
        (file.type?.includes("pdf")
          ? "pdf"
          : file.type?.includes("image")
          ? "jpg" || "png" || "jpeg"
          : "file");

      link.download = `${expense.expenseType}_${expense.amount}_receipt.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setSuccess(`Receipt downloaded successfully`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Error downloading receipt: " + error.message);
    }
  };

  // helper - sanitize filename parts
  const safeFilename = (s) =>
    (s || "")
      .toString()
      .replace(/[/\\?%*:|"<>]/g, "-")
      .replace(/\s+/g, "_")
      .slice(0, 80);

  // helper - guess extension from mime/name
  const getExtension = (name, type) => {
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

  //  Download all receipts in a submission as ZIP
  const downloadAllReceipts = async (submission) => {
    try {
      if (!submission || !Array.isArray(submission.expenses)) {
        setError("No expenses found in this submission");
        return;
      }

      // collect all files
      const files = [];
      submission.expenses.forEach((exp, expIdx) => {
        (exp.files || []).forEach((f, fileIdx) => {
          files.push({
            expense: exp,
            file: f,
            expIdx,
            fileIdx,
          });
        });
      });

      const zip = new JSZip();

      // Put files inside a folder for neatness
      const baseFolderName = safeFilename(
        `${submission.employeeName || "Employee"}_${
          submission.employeeCode || "Code"
        }_${new Date(
          submission.createdAt || submission.updatedAt
        ).toLocaleDateString()}`
      );

      const root = zip.folder(baseFolderName) || zip;

      // add files
      for (const { expense, file, expIdx, fileIdx } of files) {
        const ext = getExtension(file.name, file.type);
        const prettyName = safeFilename(
          `${String(expIdx + 1).padStart(2, "0")}_${
            expense.expenseType || "expense"
          }_${expense.amount || 0}_${String(fileIdx + 1).padStart(
            2,
            "0"
          )}.${ext}`
        );

        // base64 decode (schema gives pure base64 string)
        // JSZip supports base64 via options
        root.file(prettyName, file.data, { base64: true });
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });

      const zipName = `${safeFilename(
        submission.employeeName || "Employee"
      )}_${safeFilename(submission.employeeCode || "Code")}_receipts.zip`;

      saveAs(zipBlob, zipName);

      setSuccess("All receipts downloaded as ZIP");
      setTimeout(() => setSuccess(""), 3000);
      handleMenuClose();
    } catch (e) {
      setError(`Failed to create ZIP: ${e.message}`);
      setTimeout(() => setError(""), 4000);
    }
  };

  const [filterType, setFilterType] = useState("month");

  // get current month name
  const currentMonth = new Date().getMonth() + 1;

  // Table filters
  const [filters, setFilters] = useState({
    name: "",
    year: "",
    month: currentMonth,
    date: "",
  });

  // Get current user info
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(user);

    // Set initial tab based on user role
    if (user?.role === "finance") {
      setActiveTab("managerApproved"); // Finance users start with "Pending Review" (managerApproved)
    }
  }, []);

  // Updated status tabs configuration based on user role
  const getStatusTabs = () => {
    if (currentUser?.role === "finance") {
      return [
        {
          value: "managerApproved",
          label: "Pending Review",
          icon: <Schedule />,
          color: "warning",
        },
        {
          value: "approved",
          label: "Fully Approved",
          icon: <CheckCircle />,
          color: "success",
        },
        {
          value: "rejected",
          label: "Rejected",
          icon: <Cancel />,
          color: "error",
        },
      ];
    } else if (currentUser?.role === "manager") {
      // Manager tabs with "My Expenses" tab
      return [
        { value: "all", label: "All", icon: <Assessment />, color: "primary" },
        {
          value: "myExpenses", // NEW TAB
          label: "My Expenses",
          icon: <Person />,
          color: "secondary",
        },
        {
          value: "pending",
          label: "Pending",
          icon: <Schedule />,
          color: "warning",
        },
        {
          value: "managerApproved",
          label: "Manager Approved",
          icon: <SupervisorAccount />,
          color: "info",
        },
        {
          value: "approved",
          label: "Fully Approved",
          icon: <CheckCircle />,
          color: "success",
        },
        {
          value: "rejected",
          label: "Rejected",
          icon: <Cancel />,
          color: "error",
        },
      ];
    } else {
      // Default tabs for admin
      return [
        { value: "all", label: "All", icon: <Assessment />, color: "primary" },
        {
          value: "pending",
          label: "Pending",
          icon: <Schedule />,
          color: "warning",
        },
        {
          value: "managerApproved",
          label: "Manager Approved",
          icon: <SupervisorAccount />,
          color: "info",
        },
        {
          value: "approved",
          label: "Fully Approved",
          icon: <CheckCircle />,
          color: "success",
        },
        {
          value: "rejected",
          label: "Rejected",
          icon: <Cancel />,
          color: "error",
        },
      ];
    }
  };

  const statusTabs = getStatusTabs();

  const fetchExpenses = async (status = "all") => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login first");
        return;
      }

      // API call to get all expenses
      const response = await axiosInstance.get("/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let expensesData = response?.data?.data || [];

      // If "My Expenses" tab is selected, filter by current user
      //NOTE - this is now handled server-side
      if (status === "myExpenses") {
        const myExpensesData = expensesData.filter(
          (exp) => exp.employeeId === currentUser?._id
        );
        setBulkSubmissions(myExpensesData);
        setMyExpenses(myExpensesData); // Store separately for reference
        return;
      }

      // Handle other status filters
      switch (status) {
        case "pending":
          expensesData = expensesData.filter((exp) => exp.status === "pending");
          break;
        case "rejected":
          expensesData = expensesData.filter(
            (exp) => exp.status === "rejected"
          );
          break;
        case "managerApproved":
          expensesData = expensesData.filter(
            (exp) =>
              exp.isManagerApproved &&
              !exp.isFinanceApproved &&
              !(exp.status === "rejected")
          );
          break;
        case "approved":
          expensesData = expensesData.filter(
            (exp) => exp.status === "approved"
          );
          break;
      }

      setBulkSubmissions(expensesData);

      // If we don't have all data yet, fetch it for stats calculation
      if (allExpensesData.length === 0) {
        setAllExpensesData(response?.data?.data || []);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setError(error.response?.data?.error || "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  // Initial load - get stats and all data
  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login first");
        return;
      }

      // Set default status based on user role
      const defaultStatus =
        currentUser?.role === "finance" ? "managerApproved" : "all";

      try {
        // Get all data
        const response = await axiosInstance.get("/expenses", {
          headers: { Authorization: `Bearer ${token}` },
        });

        let expensesData = response?.data?.data || [];

        setAllExpensesData(expensesData);

        // Filter for default tab
        let filteredData = expensesData;
        if (defaultStatus === "managerApproved") {
          filteredData = expensesData.filter(
            (exp) => exp.isManagerApproved && !exp.isFinanceApproved
          );
        }

        setBulkSubmissions(filteredData);
      } catch (error) {
        console.error("Error in initial fetch:", error);
        setError("Failed to fetch expenses");
      }
    };

    if (currentUser) {
      fetchInitialData();
    }
  }, [currentUser]);

  // Tab changes - no stats
  useEffect(() => {
    if (activeTab && currentUser) {
      fetchExpenses(activeTab);
    }
  }, [activeTab, currentUser]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleHome = () => {
    router.push("/main");
  };

  const handleCreateExpense = () => {
    router.push("/employee/travel-expense/upload");
  };

  // Handle individual expense action (Finance only) or bulk action (Manager)
  const handleIndividualAction = async () => {
    try {
      const token = localStorage.getItem("token");

      // Find the submission
      const submission =
        actionDialog.submission ||
        bulkSubmissions.find((sub) =>
          sub.expenses.some((exp) => exp._id === actionDialog.expense?._id)
        );

      if (!submission) {
        setError("Submission not found");
        return;
      }

      let endpoint;

      // Manager: Bulk review (approve/reject entire submission)
      if (currentUser?.role === "manager") {
        endpoint = `/expenses/${submission._id}/manager-review`;

        await axiosInstance.patch(
          endpoint,
          {
            action: actionDialog.action,
            adminComments: comments,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      // Finance: Individual expense review
      else if (currentUser?.role === "finance") {
        if (!actionDialog.expense) {
          setError("No expense selected");
          return;
        }

        endpoint = `/expenses/${submission._id}/expense/${actionDialog.expense._id}/finance-review`;

        await axiosInstance.patch(
          endpoint,
          {
            action: actionDialog.action,
            adminComments: comments,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      const actionMessage =
        actionDialog.action === "managerApproved"
          ? "Manager approved"
          : actionDialog.action;

      setActionDialog({
        open: false,
        expense: null,
        submission: null,
        action: "",
        type: "individual",
      });

      setSuccess(
        `${
          currentUser?.role === "manager" ? "Submission" : "Expense"
        } ${actionMessage} successfully!`
      );
      setComments("");

      // Refresh data
      fetchExpenses(activeTab);

      // Refresh all data for stats calculation
      const allDataResponse = await axiosInstance.get("/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllExpensesData(allDataResponse?.data?.data || []);

      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error in handleIndividualAction:", error);
      setError(error.response?.data?.error || error.message);
    }
  };

  const viewDocument = async (expense) => {
    try {
      if (!expense.files || expense.files.length === 0) {
        setError("No document found for this expense");
        return;
      }

      const file = expense.files[0];
      const byteCharacters = atob(file.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file.type });

      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setError("Error viewing document: " + error.message);
    }
  };

  const getSubmissionStatus = (expenses) => {
    const statuses = expenses.map((exp) => exp.status);
    if (statuses.every((status) => status === "approved")) return "approved";
    if (statuses.some((status) => status === "rejected")) return "rejected";
    if (statuses.some((status) => status === "managerApproved"))
      return "managerApproved";
    return "pending";
  };

  const getStatusCounts = (expenses) => {
    return expenses.reduce((acc, exp) => {
      acc[exp.status] = (acc[exp.status] || 0) + 1;
      return acc;
    }, {});
  };

  const toggleExpanded = (submissionId) => {
    setExpandedSubmission(
      expandedSubmission === submissionId ? null : submissionId
    );
  };

  // Store all expenses data for stats calculation (independent of current tab filter)
  const [allExpensesData, setAllExpensesData] = useState([]);

  const calculateTotals = () => {
    // If on "My Expenses" tab, calculate totals only for user's expenses
    let dataToCalculate = allExpensesData;

    if (activeTab === "myExpenses" && currentUser?._id) {
      dataToCalculate = allExpensesData.filter(
        (exp) => exp.employeeId === currentUser._id
      );
    }

    const allExpenses = dataToCalculate.flatMap((submission) =>
      Array.isArray(submission.expenses) ? submission.expenses : []
    );

    return allExpenses.reduce(
      (acc, expense) => {
        acc.total += parseFloat(expense.amount) || 0;
        if (expense.status === "approved")
          acc.approved += parseFloat(expense.amount) || 0;
        if (expense.status === "pending")
          acc.pending += parseFloat(expense.amount) || 0;
        if (expense.status === "rejected")
          acc.rejected += parseFloat(expense.amount) || 0;
        if (expense.status === "managerApproved")
          acc.managerApproved += parseFloat(expense.amount) || 0;
        return acc;
      },
      { total: 0, approved: 0, pending: 0, rejected: 0, managerApproved: 0 }
    );
  };

  // Check if user can perform bulk actions on a submission
  const canPerformBulkAction = (submission) => {
    if (currentUser?.role === "manager") {
      // Manager can approve/reject submissions where all expenses are pending
      return submission.expenses.every((exp) => exp.status === "pending");
    } else if (currentUser?.role === "finance") {
      // Finance can approve/reject submissions where all expenses are managerApproved
      return submission.expenses.every(
        (exp) => exp.status === "managerApproved"
      );
    }
    return false;
  };

  // Check if individual expense can be acted upon
  const canActOnExpense = (expense) => {
    if (currentUser?.role === "manager") {
      return false; // Managers should NOT see individual actions
    } else if (
      currentUser?.role === "finance" ||
      currentUser?.role === "admin"
    ) {
      return (
        expense.status === "managerApproved" || expense.status === "pending"
      );
    }
    return false;
  };

  const totals = calculateTotals();

  const totalForFinance =
    totals.approved + totals.rejected + totals.managerApproved;

  // ---- Filtering helpers ----
  const normalize = (s) => (s || "").toString().trim().toLowerCase();

  const dateInRangeOrEqual = (theDate, start, end) => {
    // checks if `theDate` (yyyy-mm-dd) falls within [start, end] (inclusive)
    if (!theDate || !start || !end) return false;
    const d = new Date(theDate);
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(d) || isNaN(s) || isNaN(e)) return false;
    return d >= s && d <= e;
  };

  const matchesYear = (d, year) => {
    if (!year || !d) return true;
    const nd = new Date(d);
    if (isNaN(nd)) return false;
    return nd.getFullYear() === Number(year);
  };

  const matchesMonth = (d, month) => {
    if (!month || !d) return true;
    const nd = new Date(d);
    if (isNaN(nd)) return false;
    // getMonth() is 0-based; our dropdown is 1-based
    return nd.getMonth() + 1 === Number(month);
  };

  // Build filtered list used for rendering the table
  const displayedSubmissions = useMemo(() => {
    const hasAnyFilter =
      normalize(filters.name) || filters.year || filters.month || filters.date;

    // Determine base data: if "myExpenses" tab, use only user's expenses
    let baseData = bulkSubmissions;

    if (!hasAnyFilter) return baseData;

    const nameNeedle = normalize(filters.name);
    const specificDate = filters.date || ""; // yyyy-mm-dd

    return baseData
      .map((submission) => {
        // Name filter: matches employeeName
        const nameOk = nameNeedle
          ? normalize(submission.employeeName).includes(nameNeedle)
          : true;
        if (!nameOk) return null;

        // Filter expenses by year/month/date
        const filteredExpenses = (submission.expenses || []).filter((exp) => {
          const start = exp.startDate ? new Date(exp.startDate) : null;
          const end = exp.endDate ? new Date(exp.endDate) : null;

          // If no dates on the expense, fail only if user asked for a date match
          if (!start || isNaN(start) || !end || isNaN(end)) {
            if (filters.year || filters.month || specificDate) return false;
            return true;
          }

          // year/month match on either start OR end date
          const yearOk =
            matchesYear(start, filters.year) || matchesYear(end, filters.year);
          const monthOk =
            matchesMonth(start, filters.month) ||
            matchesMonth(end, filters.month);

          if (filters.year && !yearOk) return false;
          if (filters.month && !monthOk) return false;

          // Specific date should lie within the travel period
          if (specificDate) {
            const yyyyMmDd = (d) => {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
              return `${y}-${m}-${day}`;
            };
            const s = yyyyMmDd(start);
            const e = yyyyMmDd(end);
            if (!dateInRangeOrEqual(specificDate, s, e)) return false;
          }

          return true;
        });

        if (filteredExpenses.length === 0) return null;

        // Return a shallow copy with filtered expenses to render
        return { ...submission, expenses: filteredExpenses };
      })
      .filter(Boolean);
  }, [bulkSubmissions, filters]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
        }}
      >
        <Box sx={{ maxWidth: 1400, mx: "auto", px: 3, py: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "8px",
                  backgroundColor:
                    currentUser?.role === "finance" ? "#10b981" : "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: 3,
                }}
              >
                {currentUser?.role === "finance" ? (
                  <AccountBalance sx={{ color: "white", fontSize: 20 }} />
                ) : (
                  <AdminPanelSettings sx={{ color: "white", fontSize: 20 }} />
                )}
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: "#1e293b",
                    lineHeight: 1.2,
                  }}
                >
                  {currentUser?.role === "finance"
                    ? "Finance Executive"
                    : currentUser?.role === "manager"
                    ? "Manager"
                    : "Admin"}{" "}
                  Dashboard
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
                  Expense review and approval
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Chip
                icon={
                  currentUser?.role === "finance" ? (
                    <AccountBalance sx={{ height: 20, width: 20 }} />
                  ) : (
                    <SupervisorAccount sx={{ height: 20, width: 20 }} />
                  )
                }
                label={currentUser?.role?.toUpperCase()}
                sx={{
                  height: 28,
                  backgroundColor:
                    currentUser?.role === "finance"
                      ? "rgba(16, 185, 129, 0.1)"
                      : "rgba(59, 130, 246, 0.1)",
                  color:
                    currentUser?.role === "finance" ? "#10b981" : "#3b82f6",
                  borderRadius: "15px",
                  fontWeight: 550,
                  boxShadow: "rgba(0, 0, 0, 0.18) 0px 2px 4px 0px inset",
                }}
              />
              <Tooltip title="Home">
                <IconButton
                  onClick={handleHome}
                  sx={{
                    height: 33,
                    width: 33,
                    color: "#000000ff",
                    "&:hover": { backgroundColor: "rgba(59, 130, 246, 0.2)" },
                  }}
                >
                  <Home />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add New Expense">
                <IconButton
                  onClick={handleCreateExpense}
                  sx={{
                    height: 33,
                    width: 33,
                    color: "#000000ff",
                    "&:hover": { backgroundColor: "rgba(96, 59, 246, 0.2)" },
                  }}
                >
                  <Receipt />
                </IconButton>
              </Tooltip>
              <Tooltip title="Logout">
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    height: 33,
                    width: 33,
                    color: "#000000ff",
                    "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.2)" },
                  }}
                >
                  <Logout />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: 1400, mx: "auto", px: 2, py: 3 }}>
        {/* Alerts */}
        {error && (
          <Fade in>
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: "8px", fontSize: "0.9rem" }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          </Fade>
        )}
        {success && (
          <Fade in>
            <Alert
              severity="success"
              sx={{ mb: 3, borderRadius: "8px", fontSize: "0.9rem" }}
              onClose={() => setSuccess("")}
            >
              {success}
            </Alert>
          </Fade>
        )}

        {/* Stats Cards - Updated labels for Finance users */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            // Show different stats based on user role
            {
              label: "Total Expenses",
              value:
                currentUser?.role === "finance"
                  ? totalForFinance
                  : totals.total,
              icon: RequestQuote,
              color: "#0969da",
              bg: "linear-gradient(135deg, #dbeafe 0%, #f0f9ff 100%)",
              border: "#0969da",
            },

            {
              label: "Pending Review", // Changed for Finance
              value:
                currentUser?.role === "finance"
                  ? totals.managerApproved
                  : totals.pending,
              icon: Schedule,
              color: "#bf8700",
              bg: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
              border: "#bf8700",
            },
            ...(currentUser?.role === "admin" || currentUser?.role === "manager"
              ? [
                  {
                    label: "Manager Approved",
                    value: totals.managerApproved || 0,
                    icon: SupervisorAccount,
                    color: "#0ea5e9",
                    bg: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
                    border: "#0ea5e9",
                  },
                ]
              : []),
            {
              label: "Fully Approved",
              value: totals.approved,
              icon: CheckCircle,
              color: "#1a7f37",
              bg: "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
              border: "#1a7f37",
            },
            {
              label: "Rejected",
              value: totals.rejected,
              icon: Cancel,
              color: "#cf222e",
              bg: "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)",
              border: "#cf222e",
            },
          ].map((stat, index) => (
            <Grid
              item
              xs={6}
              sm={currentUser?.role === "finance" ? 3 : 2.4}
              key={index}
              sx={{ mx: "auto" }}
            >
              <Card
                elevation={1}
                sx={{
                  borderRadius: "8px",
                  background: stat.bg,
                  border: `1px solid ${stat.border}20`,
                }}
              >
                <CardContent sx={{ p: 2.5, textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1.5,
                    }}
                  >
                    <stat.icon
                      sx={{
                        fontSize: 20,
                        color: stat.color,
                        mr: 1,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: stat.color,
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: stat.color,
                      fontSize: "1.5rem",
                      lineHeight: 1,
                      fontFamily: '"SF Mono", "Monaco", monospace',
                    }}
                  >
                    ₹{stat.value.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Main Content Card */}
        <Card
          elevation={1}
          sx={{
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "white",
            border: "1px solid #e1e4e8",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            display: "flex",
            flexDirection: "column",
            minHeight: "400px",
            maxHeight: { xs: "55vh", sm: "65vh", md: "70vh", lg: "77vh" },
          }}
        >
          {/* Tabs + Filters in one row */}
          <Box
            sx={{
              display: "flex",
              alignItems: "stretch",
              gap: 2,
              borderBottom: "1px solid #e1e4e8",
              px: 2,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{
                flex: 1,
                minWidth: 0,
                "& .MuiTab-root": {
                  minHeight: 60,
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "0.875rem",
                },
                "& .Mui-selected": { color: "#0969da" },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#0969da",
                  height: 3,
                },
              }}
              variant="scrollable"
              scrollButtons="auto"
            >
              {statusTabs.map((tab) => (
                <Tab
                  key={tab.value}
                  label={tab.label}
                  value={tab.value}
                  icon={tab.icon}
                  iconPosition="start"
                />
              ))}
            </Tabs>

            {/* Right-aligned filter menu */}
            <Box
              sx={{
                ml: "auto",
                display: "flex",
                alignItems: "center",
                borderLeft: "1px solid #e1e4e8",
              }}
            >
              <ExpenseFiltersMenu
                filterType={filterType}
                setFilterType={setFilterType}
                filters={filters}
                setFilters={setFilters}
                compact
              />
            </Box>
          </Box>

          {/* Scrollable Content */}
          <CardContent
            sx={{
              p: 2,
              flex: 1,
              overflowY: "auto",
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f1f3f4",
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#c1c8cd",
                borderRadius: "3px",
                "&:hover": { backgroundColor: "#a8b1ba" },
              },
            }}
          >
            {/* Loading State */}
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress size={40} />
              </Box>
            ) : displayedSubmissions.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <PendingActions
                  sx={{ fontSize: 64, color: "grey.300", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No expense submissions found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {
                     activeTab === "all" || activeTab === "myExpenses" 
                    ? "No expense submissions to display"
                    : activeTab === "managerApproved" &&
                      currentUser?.role === "finance"
                    ? "No pending review expense submissions to display"
                    : `No ${activeTab} expense submissions to display`}
                </Typography>
                {activeTab === "myExpenses" && (
                  <Button
                    variant="contained"
                    startIcon={<Receipt />}
                    onClick={handleCreateExpense}
                    sx={{
                      mt: 3,
                      borderRadius: "8px",
                      fontWeight: 600,
                      //FIXME - update gradient colors
                      background:
                        "linear-gradient(135deg, #4f98f7ff 0%, #96cff5ff 100%)",
                      "&:hover": {
                        transform: "translateY(-1px)",
                        boxShadow: "0 8px 20px rgba(102, 126, 234, 0.4)",
                      },
                    }}
                  >
                    Create an Expense
                  </Button>
                )}
              </Box>
            ) : displayedSubmissions.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <PendingActions
                  sx={{ fontSize: 64, color: "grey.300", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No expense submissions found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No{" "}
                  {activeTab === "all"
                    ? ""
                    : activeTab === "managerApproved" &&
                      currentUser?.role === "finance"
                    ? "pending review"
                    : activeTab}{" "}
                  expense submissions to display
                </Typography>
              </Box>
            ) : (
              /* Submission Cards with Manager Approved Chip for Finance */
              <Grid container spacing={2}>
                {displayedSubmissions.map((submission) => {
                  const submissionStatus = getSubmissionStatus(
                    submission.expenses
                  );
                  const statusCounts = getStatusCounts(submission.expenses);
                  const isExpanded = expandedSubmission === submission._id;

                  return (
                    <Grid item xs={12} key={submission._id}>
                      <Card
                        elevation={1}
                        sx={{
                          borderRadius: "6px",
                          border: "0.1px solid #d1d5db",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": {
                            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
                          },
                        }}
                      >
                        {/* Card Header with Prominent Amount */}
                        <CardContent
                          sx={{ p: 2, cursor: "pointer" }}
                          onClick={() => toggleExpanded(submission._id)}
                        >
                          {/* Header with Export Button */}
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              mb: 1,
                            }}
                          >
                            {/* Prominent Amount with Status Color */}
                            <Typography
                              variant="h5"
                              sx={{
                                fontWeight: 800,
                                color:
                                  submissionStatus === "approved"
                                    ? "#1a7f37"
                                    : submissionStatus === "rejected"
                                    ? "#cf222e"
                                    : submissionStatus === "managerApproved"
                                    ? currentUser?.role === "finance"
                                      ? "#bf8700"
                                      : "#37bdfbff"
                                    : submissionStatus === "pending"
                                    ? "#bf8700"
                                    : "#1e293b",
                                fontFamily: '"SF Mono", "Monaco", monospace',
                              }}
                            >
                              ₹{submission.totalAmount?.toLocaleString()}
                            </Typography>

                            {/* Export Menu Button */}
                            <Tooltip title="Export Options">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMenuOpen(e, submission);
                                }}
                                sx={{
                                  color: "#64748b",
                                  "&:hover": {
                                    backgroundColor: "rgba(100, 116, 139, 0.1)",
                                    color: "#0969da",
                                  },
                                }}
                              >
                                <MoreVert />
                              </IconButton>
                            </Tooltip>
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Box sx={{ flexGrow: 1 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  mb: 0.8,
                                  pt: 1,
                                }}
                              >
                                {/* Small Employee Name */}
                                <Typography
                                  sx={{
                                    fontWeight: 600,
                                    color: "#293446ff",
                                    fontSize: "1rem",
                                  }}
                                >
                                  {submission?.employeeName}
                                </Typography>
                                {/* Subtle Employee Code */}
                                {submission.employeeCode && (
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: "#64748b",
                                      fontFamily:
                                        '"SF Mono", "Monaco", monospace',
                                      backgroundColor: "#edf1f5ff",
                                      px: 1.5,
                                      py: 0.5,
                                      borderRadius: "10px",
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    {submission.employeeCode}
                                  </Typography>
                                )}

                                {/* "My Expense" Chip */}
                                {activeTab!=="myExpenses" && submission.employeeId === currentUser?._id && (
                                  <Chip
                                    label="My Expense"
                                    size="small"
                                    sx={{
                                      backgroundColor:
                                        "rgba(102, 126, 234, 0.1)",
                                      color: "#5d76e6ff",
                                      border:
                                        "1px solid rgba(102, 126, 234, 0.3)",
                                      fontWeight: 600,
                                      fontSize: "0.7rem",
                                    }}
                                  />
                                )}

                                {/* Status Chips */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {/* Primary Status */}
                                  {submissionStatus === "approved" && (
                                    <Chip
                                      label={`${statusCounts.approved} Approved`}
                                      size="small"
                                      sx={{
                                        background:
                                          "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
                                        color: "#1a7f37",
                                        border: "1px solid #1a7f3720",
                                        borderRadius: "20px",
                                        fontWeight: 600,
                                        fontSize: "0.7rem",
                                      }}
                                    />
                                  )}
                                  {submissionStatus === "managerApproved" && (
                                    <>
                                      {currentUser?.role === "finance" ? (
                                        <>
                                          <Chip
                                            label="Pending Review"
                                            size="small"
                                            sx={{
                                              background:
                                                "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
                                              color: "#bf8700",
                                              border: "1px solid #bf870020",
                                              borderRadius: "20px",
                                              fontWeight: 600,
                                              fontSize: "0.7rem",
                                            }}
                                          />
                                          <Chip
                                            icon={<SupervisorAccount />}
                                            label="Manager ✓"
                                            size="small"
                                            sx={{
                                              backgroundColor:
                                                "rgba(59, 130, 246, 0.1)",
                                              color: "#3b82f6",
                                              border:
                                                "1px solid rgba(59, 130, 246, 0.2)",
                                              fontWeight: 500,
                                              fontSize: "0.7rem",
                                            }}
                                          />
                                        </>
                                      ) : (
                                        <Chip
                                          label="Manager Approved"
                                          size="small"
                                          sx={{
                                            background:
                                              "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
                                            color: "#0ea5e9",
                                            border: "1px solid #0ea5e920",
                                            borderRadius: "20px",
                                            fontWeight: 600,
                                            fontSize: "0.7rem",
                                          }}
                                        />
                                      )}
                                    </>
                                  )}
                                  {submission.overallStatus === "pending" && (
                                    <Chip
                                      label={`${statusCounts.pending} Pending`}
                                      size="small"
                                      sx={{
                                        background:
                                          "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
                                        color: "#bf8700",
                                        border: "1px solid #bf870020",
                                        borderRadius: "20px",
                                        fontWeight: 600,
                                        fontSize: "0.7rem",
                                      }}
                                    />
                                  )}
                                  {submissionStatus === "rejected" && (
                                    <Chip
                                      label={`${statusCounts.rejected} Rejected`}
                                      size="small"
                                      sx={{
                                        background:
                                          "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)",
                                        color: "#cf222e",
                                        border: "1px solid #cf222e20",
                                        borderRadius: "20px",
                                        fontWeight: 600,
                                        fontSize: "0.7rem",
                                      }}
                                    />
                                  )}

                                  {/* Resubmitted - Subtle */}
                                  {submission.isResubmitted &&
                                    submission.resubmissionCount > 0 && (
                                      <Chip
                                        label="Resubmitted"
                                        size="small"
                                        sx={{
                                          backgroundColor:
                                            "rgba(100, 116, 139, 0.1)",
                                          color: "#64748b",
                                          border:
                                            "1px solid rgba(100, 116, 139, 0.2)",
                                          fontWeight: 500,
                                          fontSize: "0.7rem",
                                        }}
                                      />
                                    )}
                                </Box>
                              </Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  fontFamily: '"SF Mono", "Monaco", monospace',
                                  mb: 0.5,
                                }}
                              >
                                {submission.expenses.length} expenses •{" "}
                                {submission.isResubmitted &&
                                submission.resubmissionCount > 0
                                  ? `Resubmitted: ${new Date(
                                      submission.updatedAt ||
                                        submission.createdAt
                                    ).toLocaleString()}`
                                  : `Submitted: ${new Date(
                                      submission.createdAt
                                    ).toLocaleString()}`}
                              </Typography>
                            </Box>

                            <IconButton sx={{ mb: 1 }}>
                              {isExpanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </Box>
                        </CardContent>

                        {/* Expanded Details */}
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ borderTop: "1px solid #e1e4e8", p: 2 }}>
                            {/* Expenses Table */}
                            <TableContainer
                              component={Paper}
                              elevation={0}
                              sx={{ border: "1px solid #e1e4e8", mb: 2 }}
                            >
                              <Table size="medium">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: "grey.50" }}>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Type
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Amount
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Description
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Period
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Purpose
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Attendees
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Status
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      Actions
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {submission.expenses.map((expense) => (
                                    <TableRow key={expense._id} hover>
                                      <TableCell>
                                        <Chip
                                          label={expense.expenseType}
                                          size="small"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Typography
                                          variant="body1"
                                          sx={{
                                            fontFamily:
                                              '"SF Mono", "Monaco", monospace',
                                            fontSize: "1rem",
                                          }}
                                        >
                                          ₹
                                          {parseFloat(
                                            expense.amount
                                          ).toLocaleString()}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Tooltip title={expense.description}>
                                          <Typography
                                            variant="body2"
                                            noWrap
                                            sx={{ maxWidth: 150 }}
                                          >
                                            {expense.description}
                                          </Typography>
                                        </Tooltip>
                                      </TableCell>
                                      <TableCell>
                                        <Typography
                                          variant="body2"
                                          display="block"
                                        >
                                          {new Date(
                                            expense.startDate
                                          ).toLocaleDateString()}
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          display="block"
                                        >
                                          to{" "}
                                          {new Date(
                                            expense.endDate
                                          ).toLocaleDateString()}
                                        </Typography>
                                      </TableCell>
                                      <TableCell>
                                        <Tooltip title={expense.purpose}>
                                          <Typography
                                            variant="body2"
                                            noWrap
                                            sx={{ maxWidth: 150 }}
                                          >
                                            {expense.purpose}
                                          </Typography>
                                        </Tooltip>
                                      </TableCell>
                                      <TableCell>
                                        <Tooltip title={expense.attendees}>
                                          <Typography
                                            variant="body2"
                                            noWrap
                                            sx={{ maxWidth: 150 }}
                                          >
                                            {expense.attendees}
                                          </Typography>
                                        </Tooltip>
                                      </TableCell>
                                      <TableCell noWrap sx={{ minWidth: 200 }}>
                                        <Box>
                                          {/* Primary Status - Special handling for Finance users */}
                                          {expense.status === "approved" && (
                                            <Chip
                                              label={"Approved"}
                                              size="small"
                                              sx={{
                                                background:
                                                  "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
                                                color: "#1a7f37",
                                                border: "1px solid #1a7f3720",
                                                borderRadius: "20px",
                                                fontWeight: 600,
                                                mb: 1,
                                                fontSize: "0.7rem",
                                              }}
                                            />
                                          )}

                                          {expense.status === "pending" && (
                                            <Chip
                                              label={"Pending"}
                                              size="small"
                                              sx={{
                                                background:
                                                  "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
                                                color: "#bf8700",
                                                border: "1px solid #bf870020",
                                                borderRadius: "20px",
                                                fontWeight: 600,
                                                mb: 1,
                                                fontSize: "0.7rem",
                                              }}
                                            />
                                          )}

                                          {expense.status ===
                                            "managerApproved" && (
                                            <>
                                              {currentUser?.role ===
                                              "finance" ? (
                                                <Chip
                                                  label={"Pending Review"}
                                                  size="small"
                                                  sx={{
                                                    background:
                                                      "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
                                                    color: "#bf8700",
                                                    border:
                                                      "1px solid #bf870020",
                                                    borderRadius: "20px",
                                                    fontWeight: 600,
                                                    mb: 1,
                                                    fontSize: "0.7rem",
                                                  }}
                                                />
                                              ) : (
                                                <Chip
                                                  label={"Manager Approved"}
                                                  size="small"
                                                  sx={{
                                                    background:
                                                      "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
                                                    color: "#0ea5e9",
                                                    border:
                                                      "1px solid #0ea5e920",
                                                    borderRadius: "20px",
                                                    fontWeight: 600,
                                                    mb: 1,
                                                    fontSize: "0.7rem",
                                                  }}
                                                />
                                              )}
                                            </>
                                          )}

                                          {expense.status === "rejected" && (
                                            <Chip
                                              label={"Rejected"}
                                              size="small"
                                              sx={{
                                                background:
                                                  "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)",
                                                color: "#cf222e",
                                                border: "1px solid #cf222e20",
                                                borderRadius: "20px",
                                                fontWeight: 600,
                                                mb: 1,
                                              }}
                                            />
                                          )}

                                          {/* Additional Status Info */}
                                          <Box
                                            sx={{
                                              display: "flex",
                                              flexWrap: "wrap",
                                              gap: 0.5,
                                            }}
                                          >
                                            {/* Show Manager approved chip */}
                                            {submission.isManagerApproved && (
                                              <Chip
                                                icon={<SupervisorAccount />}
                                                label="Manager ✓"
                                                size="small"
                                                sx={{
                                                  backgroundColor:
                                                    "rgba(59, 130, 246, 0.1)",
                                                  color: "#3b82f6",
                                                  fontWeight: 500,
                                                  fontSize: "0.7rem",
                                                }}
                                              />
                                            )}

                                            {submission.isFinanceApproved && (
                                              <Chip
                                                icon={<AccountBalance />}
                                                label="Finance ✓"
                                                size="small"
                                                sx={{
                                                  backgroundColor:
                                                    "rgba(16, 185, 129, 0.1)",
                                                  color: "#10b981",
                                                  fontWeight: 500,
                                                  fontSize: "0.7rem",
                                                }}
                                              />
                                            )}

                                            {/* Subtle Edit indicators */}
                                            {expense.isResubmitted && (
                                              <Chip
                                                label="Resubmitted"
                                                size="small"
                                                sx={{
                                                  backgroundColor:
                                                    "rgba(100, 116, 139, 0.1)",
                                                  color: "#64748b",
                                                  fontWeight: 500,
                                                  fontSize: "0.7rem",
                                                }}
                                              />
                                            )}
                                          </Box>

                                          {/* Rejection comments */}
                                          {expense.adminComments &&
                                            expense.status === "rejected" && (
                                              <Tooltip
                                                title={expense.adminComments}
                                              >
                                                <Typography
                                                  variant="caption"
                                                  color="error"
                                                  sx={{
                                                    mt: 1,
                                                    pl: 0.5,
                                                    cursor: "pointer",
                                                  }}
                                                >
                                                  View reason
                                                </Typography>
                                              </Tooltip>
                                            )}
                                        </Box>
                                      </TableCell>
                                      <TableCell>
                                        <Box sx={{ display: "flex", gap: 0.5 }}>
                                          {/* Edit Button  */}
                                          {canEditExpense(
                                            expense,
                                            submission
                                          ) && (
                                            <Tooltip title="Edit Expense">
                                              <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleEditExpense(
                                                    expense,
                                                    submission
                                                  );
                                                }}
                                                sx={{
                                                  color: "warning.main",
                                                  transition: "all 0.2s ease",
                                                  "&:hover": {
                                                    transform:
                                                      "scale(1.1) rotate(15deg)",
                                                    color: "warning.dark",
                                                  },
                                                }}
                                              >
                                                <Edit fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                          )}
                                          {/* View Document Button */}
                                          {expense.files &&
                                            expense.files.length > 0 && (
                                              <Tooltip title="view">
                                                <IconButton
                                                  size="small"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    viewDocument(expense);
                                                  }}
                                                  sx={{ color: "info.main" }}
                                                >
                                                  <Visibility fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                            )}

                                          {/* Download Receipt Button */}
                                          {expense.files &&
                                            expense.files.length > 0 && (
                                              <Tooltip title="Download Receipt">
                                                <IconButton
                                                  size="small"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    downloadReceipt(expense);
                                                  }}
                                                  sx={{ color: "#10b981" }}
                                                >
                                                  <Download fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                            )}

                                          {/* Individual Approve/Disapprove buttons for Finance only */}
                                          {canActOnExpense(expense) && (
                                            <>
                                              <Tooltip title="Approve">
                                                <IconButton
                                                  size="small"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActionDialog({
                                                      open: true,
                                                      expense,
                                                      submission: submission,
                                                      action: "approved",
                                                      type: "individual",
                                                    });
                                                  }}
                                                  sx={{
                                                    color: "success.main",
                                                  }}
                                                >
                                                  <ThumbUp fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                              <Tooltip title="Reject">
                                                <IconButton
                                                  size="small"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActionDialog({
                                                      open: true,
                                                      expense,
                                                      submission: submission,
                                                      action: "rejected",
                                                      type: "individual",
                                                    });
                                                  }}
                                                  sx={{ color: "error.main" }}
                                                >
                                                  <ThumbDown fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                            </>
                                          )}
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>

                            {/* Simplified Resubmission History with Time */}
                            {submission.isResubmitted && (
                              <Box
                                sx={{
                                  mt: 2,
                                  p: 2,
                                  borderRadius: "8px",
                                  backgroundColor: "rgba(100, 116, 139, 0.05)",
                                  border: "1px solid rgba(100, 116, 139, 0.2)",
                                }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    color: "#64748b",
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 1,
                                  }}
                                >
                                  <Edit fontSize="small" />
                                  Resubmission History
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "#64748b",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  Originally:{" "}
                                  {new Date(
                                    submission.createdAt
                                  ).toLocaleString()}{" "}
                                  • Resubmitted:{" "}
                                  {new Date(
                                    submission.updatedAt || submission.createdAt
                                  ).toLocaleString()}
                                </Typography>
                              </Box>
                            )}

                            {/* Bulk Action Buttons at Bottom - Updated for Finance */}
                            {canPerformBulkAction(submission) && (
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  gap: 2,
                                  p: 2,
                                }}
                              >
                                {currentUser?.role === "manager" && (
                                  <>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      startIcon={<CheckCircle />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActionDialog({
                                          open: true,
                                          expense: null,
                                          submission,
                                          action: "managerApproved",
                                          type: "bulk",
                                        });
                                      }}
                                      sx={{
                                        borderRadius: "8px",
                                        fontWeight: 600,
                                        px: 1,
                                        textTransform: "none",
                                        fontSize: "0.8rem",
                                        background:
                                          "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
                                        color: "#1a7f37",
                                        border: "1px solid #1a7f3750",
                                        boxShadow: "none",
                                        "&:hover": {
                                          transform: "translateY(-1px)",
                                          boxShadow:
                                            "0 4px 12px rgba(26, 127, 55, 0.3)",
                                          background:
                                            "linear-gradient(135deg, #bbf7d0 0%, #dcfce7 100%)",
                                        },
                                        transition: "all 0.2s ease",
                                      }}
                                    >
                                      APPROVE ALL
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={<Cancel />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActionDialog({
                                          open: true,
                                          expense: null,
                                          submission,
                                          action: "rejected",
                                          type: "bulk",
                                        });
                                      }}
                                      sx={{
                                        borderRadius: "8px",
                                        fontWeight: 600,
                                        px: 1,
                                        textTransform: "none",
                                        fontSize: "0.8rem",
                                        background:
                                          "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)",
                                        color: "#cf222e",
                                        border: "1px solid #cf222e50",
                                        "&:hover": {
                                          transform: "translateY(-1px)",
                                          boxShadow:
                                            "0 4px 12px rgba(207, 34, 46, 0.3)",
                                          background:
                                            "linear-gradient(135deg, #fecaca 0%, #fee2e2 100%)",
                                        },
                                        transition: "all 0.2s ease",
                                      }}
                                    >
                                      REJECT ALL
                                    </Button>
                                  </>
                                )}
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Export Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            elevation: 8,
            sx: {
              borderRadius: "8px",

              fontWeight: 600,
              minWidth: 220,
              "& .MuiMenuItem-root": {
                px: 2,
                py: 1.5,
                borderRadius: "4px",
                mx: 0.5,
                my: 0.25,
                "&:hover": {
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                },
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem onClick={() => exportToExcel(selectedSubmission)} sx={{}}>
            <ListItemIcon>
              <FileDownload sx={{ fontSize: 20, color: "#04dd37b5" }} />
            </ListItemIcon>
            <ListItemText
              primary="Export to Excel"
              primaryTypographyProps={{
                sx: {
                  fontWeight: 600,
                  color: "#373737de",
                },
              }}
            />
          </MenuItem>

          {/* NEW: Download all receipts as ZIP */}
          <MenuItem
            disabled={
              !selectedSubmission?.expenses?.some(
                (exp) => exp.files && exp.files.length > 0
              )
            }
            onClick={() => downloadAllReceipts(selectedSubmission)}
          >
            <ListItemIcon>
              <FolderZip sx={{ fontSize: 20, color: "#e4c605c6" }} />
            </ListItemIcon>
            <ListItemText
              primary="Download all receipts"
              primaryTypographyProps={{
                sx: {
                  fontWeight: 600,
                  color: "#373737de",
                },
              }}
            />
          </MenuItem>
        </Menu>

        {/* Action Dialog */}
        <Dialog
          open={actionDialog.open}
          onClose={() => {
            setActionDialog({
              open: false,
              expense: null,
              submission: null,
              action: "",
              type: "individual",
            });
            setComments("");
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: "12px" },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor:
                    actionDialog.action === "approved" ||
                    actionDialog.action === "managerApproved"
                      ? "success.main"
                      : "error.main",
                  mr: 2,
                }}
              >
                {actionDialog.action === "approved" ||
                actionDialog.action === "managerApproved" ? (
                  currentUser?.role === "manager" ? (
                    <ThumbUp />
                  ) : (
                    <AccountBalance />
                  )
                ) : actionDialog.action === "rejected" ? (
                  <ThumbDown />
                ) : (
                  <Assessment />
                )}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {currentUser?.role === "manager" ? "Manager" : "Finance"}{" "}
                  {actionDialog.action === "approved" ||
                  actionDialog.action === "managerApproved"
                    ? "Approve"
                    : "Reject"}{" "}
                  {actionDialog.type === "bulk" ? "All Expenses" : "Expense"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review and confirm your decision
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              {/* Employee Details */}
              <Paper
                elevation={0}
                sx={{ p: 2, bgcolor: "grey.50", borderRadius: "8px" }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Employee Details:
                </Typography>
                <Typography variant="body2">
                  <strong>
                    {actionDialog.submission?.employeeName ||
                      bulkSubmissions.find((sub) =>
                        sub.expenses.some(
                          (exp) => exp._id === actionDialog.expense?._id
                        )
                      )?.employeeName}
                  </strong>{" "}
                  (
                  {actionDialog.submission?.employeeCode ||
                    bulkSubmissions.find((sub) =>
                      sub.expenses.some(
                        (exp) => exp._id === actionDialog.expense?._id
                      )
                    )?.employeeCode}
                  )
                </Typography>
              </Paper>

              {/* Expense Details */}
              {actionDialog.type === "individual" && actionDialog.expense && (
                <Paper
                  elevation={0}
                  sx={{ p: 2, bgcolor: "grey.50", borderRadius: "8px" }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Expense Details
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Type:</strong> {actionDialog.expense.expenseType}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Amount:</strong> ₹{actionDialog.expense.amount}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Description:</strong>{" "}
                    {actionDialog.expense.description}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Travel Period:</strong>{" "}
                    {actionDialog.expense.startDate
                      ? new Date(
                          actionDialog.expense.startDate
                        ).toLocaleDateString()
                      : "Not available"}{" "}
                    -{" "}
                    {actionDialog.expense.endDate
                      ? new Date(
                          actionDialog.expense.endDate
                        ).toLocaleDateString()
                      : "Not available"}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Purpose:</strong> {actionDialog.expense.purpose}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Attendees:</strong> {actionDialog.expense.attendees}
                  </Typography>
                </Paper>
              )}

              {/* Bulk Action Details */}
              {actionDialog.type === "bulk" && actionDialog.submission && (
                <Paper
                  elevation={0}
                  sx={{ p: 2, bgcolor: "grey.50", borderRadius: "8px" }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Bulk Action Details
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Total Expenses:</strong>{" "}
                    {actionDialog.submission.expenses.length}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Total Amount:</strong> ₹
                    {actionDialog.submission.totalAmount?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Action:</strong>{" "}
                    {actionDialog.action === "approved" ||
                    actionDialog.action === "managerApproved"
                      ? "Approve"
                      : "Reject"}{" "}
                    all expenses in this submission
                  </Typography>
                </Paper>
              )}

              {/* Approval History */}
              {actionDialog.submission?.isManagerApproved && (
                <Paper
                  elevation={0}
                  sx={{ p: 2, bgcolor: "info.50", borderRadius: "8px" }}
                >
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    color="info.dark"
                  >
                    Previous Approvals:
                  </Typography>
                  <Typography variant="body2" color="info.dark">
                    <strong>Manager:</strong> Approved
                  </Typography>
                </Paper>
              )}

              {/* Comments Field */}
              <TextField
                label={
                  actionDialog.action === "approved" ||
                  actionDialog.action === "managerApproved"
                    ? `${
                        currentUser?.role === "manager" ? "Manager" : "Finance"
                      } Approval Comments (Optional)`
                    : `${
                        currentUser?.role === "manager" ? "Manager" : "Finance"
                      } Rejection Reason (Required)`
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                fullWidth
                multiline
                rows={3}
                required={actionDialog.action === "rejected"}
                placeholder={
                  actionDialog.action === "approved" ||
                  actionDialog.action === "managerApproved"
                    ? "Add any approval notes (optional)..."
                    : "Please provide a reason for rejection (required)..."
                }
                error={actionDialog.action === "rejected" && !comments.trim()}
                helperText={
                  actionDialog.action === "rejected" && !comments.trim()
                    ? "Rejection reason is required"
                    : ""
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                  },
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button
              onClick={() => {
                setActionDialog({
                  open: false,
                  expense: null,
                  submission: null,
                  action: "",
                  type: "individual",
                });
                setComments("");
              }}
              variant="outlined"
              sx={{ borderRadius: "8px" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleIndividualAction}
              color={
                actionDialog.action === "approved" ||
                actionDialog.action === "managerApproved"
                  ? "success"
                  : "error"
              }
              variant="contained"
              disabled={actionDialog.action === "rejected" && !comments.trim()}
              sx={{
                borderRadius: "8px",
                "&:hover": {
                  transform: "translateY(-1px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              {actionDialog.action === "approved" ||
              actionDialog.action === "managerApproved"
                ? `${
                    currentUser?.role === "manager" ? "Manager" : "Finance"
                  } Approve ${actionDialog.type === "bulk" ? "All" : "Expense"}`
                : `${
                    currentUser?.role === "manager" ? "Manager" : "Finance"
                  } Reject ${actionDialog.type === "bulk" ? "All" : "Expense"}`}
            </Button>
          </DialogActions>
        </Dialog>
        {/* Edit Expense Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: "12px" },
          }}
        >
          {selectedExpense && (
            <>
              <DialogTitle sx={{ borderBottom: "1px solid #e1e4e8", pb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar
                    sx={{
                      bgcolor: "warning.main",
                      mr: 2,
                      fontWeight: 600,
                    }}
                  >
                    <Edit />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      Edit Expense
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Modify expense details - will require re-approval
                    </Typography>
                  </Box>
                </Box>
              </DialogTitle>

              <DialogContent sx={{ pt: "20px !important" }}>
                <Grid container spacing={3}>
                  {/* Rejection Comments Display */}
                  {selectedExpense.adminComments &&
                    selectedExpense.status === "rejected" && (
                      <Grid item xs={12}>
                        <Alert severity="error" sx={{ borderRadius: "8px" }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Rejection Reason:
                          </Typography>
                          <Typography variant="body2">
                            {selectedExpense.adminComments}
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Expense Type</InputLabel>
                      <Select
                        value={editFormData.expenseType}
                        label="Expense Type"
                        onChange={(e) =>
                          handleFormChange("expenseType", e.target.value)
                        }
                        sx={{ borderRadius: "8px" }}
                      >
                        {[
                          "travel",
                          "accommodation",
                          "meals",
                          "transport",
                          "office_supplies",
                          "training",
                          "other",
                        ].map((type) => (
                          <MenuItem key={type} value={type}>
                            {type
                              .replace("_", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Amount (₹)"
                      type="number"
                      value={editFormData.amount}
                      onChange={(e) =>
                        handleFormChange("amount", e.target.value)
                      }
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                      value={editFormData.description}
                      onChange={(e) =>
                        handleFormChange("description", e.target.value)
                      }
                      placeholder="Enter expense description..."
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Travel Start Date"
                      type="date"
                      value={editFormData.startDate}
                      onChange={(e) =>
                        handleFormChange("startDate", e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Travel End Date"
                      type="date"
                      value={editFormData.endDate}
                      onChange={(e) =>
                        handleFormChange("endDate", e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Purpose"
                      multiline
                      rows={3}
                      value={editFormData.purpose}
                      onChange={(e) =>
                        handleFormChange("purpose", e.target.value)
                      }
                      placeholder="Enter expense purpose..."
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Attendees"
                      multiline
                      rows={3}
                      value={editFormData.attendees}
                      onChange={(e) =>
                        handleFormChange("attendees", e.target.value)
                      }
                      placeholder="Enter expense attendees..."
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                      }}
                    />
                  </Grid>

                  {/* Current File Display */}
                  {selectedExpense.files &&
                    selectedExpense.files.length > 0 &&
                    !newFile && (
                      <Grid item xs={12}>
                        <Card
                          sx={{
                            bgcolor: "grey.50",
                            border: "1px solid #e1e4e8",
                            borderRadius: "8px",
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <Avatar sx={{ bgcolor: "primary.main" }}>
                                {getFileIcon(selectedExpense.files[0].name)}
                              </Avatar>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography
                                  variant="subtitle2"
                                  color="text.secondary"
                                >
                                  Current Receipt
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 550 }}
                                >
                                  {selectedExpense.files[0].name}
                                </Typography>
                              </Box>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => viewDocument(selectedExpense)}
                                sx={{ borderRadius: "6px" }}
                              >
                                View
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}

                  {/* File Upload */}
                  <Grid item xs={12}>
                    <Card
                      elevation={newFile ? 1 : 0}
                      sx={{
                        border: newFile
                          ? "2px solid #22c55e"
                          : "2px dashed #cbd5e1",
                        bgcolor: newFile ? "#f0fdf4" : "#fafbfc",
                        borderRadius: "12px",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        {!newFile ? (
                          <Box sx={{ textAlign: "center" }}>
                            <CloudUpload
                              sx={{
                                fontSize: 48,
                                color: "text.secondary",
                                mb: 2,
                              }}
                            />
                            <Typography variant="h6" sx={{ mb: 1 }}>
                              Upload New Receipt
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 2 }}
                            >
                              Choose a file to upload (JPEG, PNG, PDF • Max
                              10MB)
                            </Typography>
                            <Button
                              component="label"
                              variant="outlined"
                              startIcon={<CloudUpload />}
                              sx={{ borderRadius: "8px" }}
                            >
                              Choose File
                              <input
                                hidden
                                accept="image/jpeg,image/jpg,image/png,application/pdf"
                                type="file"
                                onChange={handleFileChange}
                              />
                            </Button>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Avatar sx={{ bgcolor: "#22c55e", color: "white" }}>
                              {getFileIcon(newFile.name)}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography
                                variant="subtitle1"
                                color="#22c55e"
                                fontWeight={600}
                              >
                                {newFile.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {formatFileSize(newFile.size)}
                              </Typography>
                            </Box>
                            <Button
                              component="label"
                              variant="outlined"
                              size="small"
                              sx={{ borderRadius: "6px" }}
                            >
                              Change
                              <input
                                hidden
                                accept="image/jpeg,image/jpg,image/png,application/pdf"
                                type="file"
                                onChange={handleFileChange}
                              />
                            </Button>
                            <IconButton
                              onClick={clearFile}
                              sx={{ color: "error.main" }}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Warning about re-approval */}
                  <Grid item xs={12}>
                    <Alert severity="warning" sx={{ borderRadius: "8px" }}>
                      <Typography variant="body2">
                        <strong>Note:</strong> Editing this expense will reset
                        its status to &quot;Pending&quot; and require
                        re-approval from the approval workflow.
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button
                  onClick={handleCloseEditDialog}
                  disabled={editLoading}
                  sx={{ borderRadius: "8px" }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveExpense}
                  variant="contained"
                  disabled={!isFormValid() || editLoading}
                  startIcon={
                    editLoading ? <CircularProgress size={16} /> : <Edit />
                  }
                  sx={{
                    borderRadius: "8px",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    },
                  }}
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Box>
  );
}
