// pages/employee/index.js

import {
  AccountBalance,
  Add,
  Assessment,
  Cancel,
  CheckCircle,
  CloudUpload,
  Delete,
  Description,
  Edit,
  ExpandLess,
  ExpandMore,
  FilePresent,
  Home,
  Logout,
  Receipt,
  Schedule,
  SupervisorAccount,
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
import React, { useEffect, useMemo, useState } from "react";

import ExpenseFiltersMenuForEmployee from "@/utils/ExpenseFiltersEmployee";
import { RequestQuote } from "@mui/icons-material";
import axiosInstance from "@/utils/helpers";
import { useRouter } from "next/navigation";

export default function ExpenseIndex() {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
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
  const [filterType, setFilterType] = useState("date");
  const [filters, setFilters] = useState({
    year: "",
    month: "",
    date: new Date().toISOString().split('T')[0],
  });

  const router = useRouter();

  useEffect(() => {
    // Get user info
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);
    fetchExpenses();
  }, []);

  // Tab configuration
  const tabs = [
    {
      value: "all",
      label: "All Expenses",
      icon: <Assessment />,
      color: "primary",
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
      label: "Approved",
      icon: <CheckCircle />,
      color: "success",
    },
    { value: "rejected", label: "Rejected", icon: <Cancel />, color: "error" },
  ];
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
    return nd.getMonth() + 1 === Number(month); 
  };

  // combine status-tab filtering + date filtering
  useEffect(() => {
    // Filter by status/tab
    let base = activeTab === "all"
      ? submissions
      : submissions
          .map((submission) => ({
            ...submission,
            expenses: submission.expenses.filter(
              (expense) => expense.status === activeTab
            ),
          }))
          .filter((submission) => submission.expenses.length > 0);

    const { year, month, date } = filters;

    // If no filters, show all
    if (!year && !month && !date) {
      setFilteredSubmissions(base);
      return;
    }

    // Apply date filters
    const filtered = base
      .map((submission) => {
        const matchingExpenses = submission.expenses.filter((expense) => {
          const start = expense.startDate ? new Date(expense.startDate) : null;
          const end = expense.endDate ? new Date(expense.endDate) : null;

          if (!start || !end || isNaN(start) || isNaN(end)) {
            return false;
          }

          if (year && !(matchesYear(start, year) || matchesYear(end, year))) {
            return false;
          }

          if (month && !(matchesMonth(start, month) || matchesMonth(end, month))) {
            return false;
          }

          if (date) {
            const filterDate = new Date(date + 'T00:00:00');
            const startDate = new Date(start.toISOString().split('T')[0] + 'T00:00:00');
            const endDate = new Date(end.toISOString().split('T')[0] + 'T00:00:00');
            
            if (!(filterDate >= startDate && filterDate <= endDate)) {
              return false;
            }
          }

          return true;
        });

        return { ...submission, expenses: matchingExpenses };
      })
      .filter((submission) => submission.expenses.length > 0);

    setFilteredSubmissions(filtered);
  }, [activeTab, submissions, filters]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login first");
        return;
      }

      const response = await axiosInstance.get("/expenses/employee", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmissions(response?.data?.data || []);
    } catch (err) {
      console.error("Error fetching expenses:", err);
      setError("Failed to load expenses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter submissions based on active tab

  const getStatusColor = (status) => {
    const colors = {
      approved: "success",
      rejected: "error",
      pending: "warning",
      managerApproved: "info",
    };
    return colors[status] || "default";
  };

  const getSubmissionStatus = (expenses) => {
    const statuses = expenses?.map((exp) => exp.status);
    if (statuses.every((status) => status === "approved")) return "approved";
    if (statuses.some((status) => status === "rejected")) return "rejected";
    if (statuses.some((status) => status === "managerApproved"))
      return "managerApproved";
    return "pending";
  };

  const getStatusCounts = (expenses) => {
    return expenses?.reduce((acc, exp) => {
      acc[exp.status] = (acc[exp.status] || 0) + 1;
      return acc;
    }, {});
  };

  const calculateTotals = () => {
    const allExpenses = submissions?.flatMap(
      (submission) => submission.expenses
    );
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

  const toggleExpanded = (submissionId) => {
    setExpandedSubmission(
      expandedSubmission === submissionId ? null : submissionId
    );
  };

  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    setEditFormData({
      expenseType: expense.expenseType || "",
      amount: expense.amount.toString(),
      description: expense.description,
      startDate: new Date(expense.startDate),
      endDate: new Date(expense.endDate),
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

    // File validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];

    if (file.size > maxSize) {
      alert("File size must be less than 10MB");
      event.target.value = "";
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert("Only JPEG, PNG, and PDF files are allowed");
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

      // Find the bulk submission ID
      const submission = submissions?.find((sub) =>
        sub.expenses.some((exp) => exp._id === selectedExpense._id)
      );

      const response = await axiosInstance.put(
        `/expenses/${submission._id}/expense/${selectedExpense._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.message) {
        handleCloseEditDialog();
        fetchExpenses();
      } else {
        setError("Failed to update expense");
      }
    } catch (err) {
      console.error("Error updating expense:", err);
      setError("Failed to update expense. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedExpense(null);
    setNewFile(null);
    setEditFormData({
      amount: "",
      attendees: "",
      description: "",
      endDate: "",
      expenseType: "",
      purpose: "",
      startDate: "",
    });
  };

  const handleViewDocument = async (expense) => {
    try {
      if (!expense.files || expense.files.length === 0) {
        alert("No document found for this expense");
        return;
      }

      const file = expense.files[0];

      if (!file.data) {
        throw new Error("File data is missing");
      }

      // Clean base64 data
      let base64Data = file.data.trim().replace(/\s+/g, "");

      // Remove data URL prefix if present
      if (base64Data.includes(",")) {
        base64Data = base64Data.split(",")[1];
      }

      // Try to decode once
      let binaryString = atob(base64Data);
    
      // Check if it's double-encoded
      const firstChars = binaryString.substring(0, 20);
      const isBase64Pattern = /^[A-Za-z0-9+/=]+$/.test(firstChars);

      // Get file signature bytes for detection
      const getSignature = (str) => {
        return Array.from(str.substring(0, 8))
          .map((c) =>
            c.charCodeAt(0).toString(16).padStart(2, "0").toUpperCase()
          )
          .join(" ");
      };

      const firstSignature = getSignature(binaryString);

      // Check for valid file signatures
      const isValidSignature = () => {
        const sig = binaryString.substring(0, 4);
        const bytes = Array.from(sig).map((c) => c.charCodeAt(0));

        // PDF: %PDF (25 50 44 46)
        if (sig.startsWith("%PDF")) {
          return true;
        }

        // PNG: 89 50 4E 47
        if (
          bytes[0] === 0x89 &&
          bytes[1] === 0x50 &&
          bytes[2] === 0x4e &&
          bytes[3] === 0x47
        ) {
          return true;
        }

        // JPEG/JPG: FF D8 FF (all JPEG files start with these bytes)
        if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
          return true;
        }

        console.warn("✗ No valid signature detected");
        return false;
      };

      // If it looks like base64 and doesn't have valid signature, try decoding again
      if (isBase64Pattern && !isValidSignature()) {
        console.warn("⚠️ Detected double-encoded base64! Decoding again...");
        try {
          binaryString = atob(binaryString);
        } catch (e) {
          console.error("Failed to decode second time:", e);
          throw new Error("File is corrupted or improperly encoded");
        }
      }

      // Verify file signature matches claimed type
      const verifyFileType = () => {
        const bytes = Array.from(binaryString.substring(0, 4)).map((c) =>
          c.charCodeAt(0)
        );
        const detectedType = { valid: false, name: "unknown" };

        // Check actual file signature
        if (binaryString.startsWith("%PDF")) {
          detectedType.valid = true;
          detectedType.name = "PDF";
        } else if (
          bytes[0] === 0x89 &&
          bytes[1] === 0x50 &&
          bytes[2] === 0x4e &&
          bytes[3] === 0x47
        ) {
          detectedType.valid = true;
          detectedType.name = "PNG";
        } else if (
          bytes[0] === 0xff &&
          bytes[1] === 0xd8 &&
          bytes[2] === 0xff
        ) {
          detectedType.valid = true;
          detectedType.name = "JPEG/JPG";
        }

        // Normalize MIME type for comparison
        const normalizedMimeType = file.type.toLowerCase();

        // Verify type matches
        if (
          normalizedMimeType === "application/pdf" &&
          detectedType.name !== "PDF"
        ) {
          console.error(
            "MIME type mismatch: Expected PDF but got",
            detectedType.name
          );
          return false;
        }

        if (normalizedMimeType === "image/png" && detectedType.name !== "PNG") {
          console.error(
            "MIME type mismatch: Expected PNG but got",
            detectedType.name
          );
          return false;
        }

        // Handle both image/jpeg and image/jpg
        if (
          (normalizedMimeType === "image/jpeg" ||
            normalizedMimeType === "image/jpg") &&
          detectedType.name !== "JPEG/JPG"
        ) {
          console.error(
            "MIME type mismatch: Expected JPEG/JPG but got",
            detectedType.name
          );
          return false;
        }

        if (!detectedType.valid) {
          console.error("Invalid or unknown file signature");
          return false;
        }

        return true;
      };

      const isValid = verifyFileType();
      if (!isValid) {
        throw new Error(
          `File appears to be corrupted. The file signature doesn't match the expected type (${file.type})`
        );
      }

      // Convert to Uint8Array
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Determine correct MIME type (normalize jpg to jpeg)
      let mimeType = file.type || "application/octet-stream";
      if (mimeType === "image/jpg") {
        mimeType = "image/jpeg"; // Normalize to standard MIME type
      }

      const blob = new Blob([bytes], { type: mimeType });

      if (blob.size === 0) {
        throw new Error("Generated blob is empty");
      }

      // Create URL
      const url = URL.createObjectURL(blob);

      // Handle different file types
      if (mimeType.startsWith("image/")) {
        // For images (including JPG, JPEG, PNG), display in a styled page
        const newWindow = window.open("", "_blank");
        if (newWindow) {
          newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${file.name}</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                body {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  background: #1a1a1a;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }
                .container {
                  max-width: 95vw;
                  max-height: 95vh;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 20px;
                  padding: 20px;
                }
                .filename {
                  color: #fff;
                  font-size: 16px;
                  font-weight: 500;
                  text-align: center;
                  word-break: break-all;
                }
                img {
                  max-width: 100%;
                  max-height: 85vh;
                  object-fit: contain;
                  border-radius: 8px;
                  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="filename">${file.name}</div>
                <img src="${url}" alt="${file.name}" />
              </div>
            </body>
          </html>
        `);
        } else {
          // Popup blocked - download instead
          const link = document.createElement("a");
          link.href = url;
          link.download = file.name || "image";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          alert("Popup blocked. File download started instead.");
        }
      } else {
        // For PDFs, open directly
        const newWindow = window.open(url, "_blank");

        if (!newWindow) {
          // Popup blocked - download instead
          const link = document.createElement("a");
          link.href = url;
          link.download = file.name || "document.pdf";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          alert("Popup blocked. File download started instead.");
        }
      }

      // Cleanup after 30 seconds
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      console.error("Error viewing document:", error);
      alert(
        `Error viewing document: ${error.message}\n\nThe file may be corrupted. Please try re-uploading it.`
      );
    }
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
      new Date(editFormData.startDate) <= new Date(editFormData.endDate)
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#fafbfc",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#fafbfc", p: 2 }}>
        <Alert severity="error" sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
          {error}
          <Button onClick={fetchExpenses} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  const totals = calculateTotals();

  const summaryStats = [
    {
      label: "Total",
      value: totals.total,
      icon: RequestQuote,
      color: "#0969da",
      bg: "linear-gradient(135deg, #dbeafe 0%, #f0f9ff 100%)",
    },
    {
      label: "Approved",
      value: totals.approved,
      icon: CheckCircle,
      color: "#1a7f37",
      bg: "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
    },
    {
      label: "Manager Approved",
      value: totals.managerApproved || 0,
      icon: SupervisorAccount,
      color: "#0ea5e9",
      bg: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
    },
    {
      label: "Pending",
      value: totals.pending,
      icon: Schedule,
      color: "#bf8700",
      bg: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
    },
    {
      label: "Rejected",
      value: totals.rejected,
      icon: Cancel,
      color: "#cf222e",
      bg: "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)",
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#fafbfc" }}>
      {/* Enhanced Header with User Profile */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: "auto", px: 3, py: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  mr: 3,
                  background: "linear-gradient(135deg, #4a7ef9ef 0%)",
                }}
              >
                <Receipt />
              </Avatar>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: "text.primary",
                    lineHeight: 1.2,
                  }}
                >
                  My Expenses
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 0.5 }}
                >
                  Track and manage your expense submissions
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Tooltip title="Home" arrow>
                <IconButton
                  onClick={() => router.push("/main")}
                  sx={{
                    color: "#000000ff",
                    "&:hover": { backgroundColor: "rgba(59, 130, 246, 0.2)" },
                  }}
                >
                  <Home />
                </IconButton>
              </Tooltip>
              <Tooltip title="Logout" arrow>
                <IconButton
                  onClick={() => {
                    localStorage.removeItem("user");
                    localStorage.removeItem("token");
                    router.push("/login");
                  }}
                  sx={{
                    color: "#000000ff",
                    "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.2)" },
                  }}
                >
                  <Logout />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={
                  <Add
                    sx={{
                      transition: "transform 0.3s ease",
                      ".MuiButton-root:hover &": {
                        transform: "rotate(180deg)",
                      },
                    }}
                  />
                }
                onClick={() => router.push("/employee/travel-expense/upload")}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.16)",
                  },
                  background: "linear-gradient(135deg, #4a7ef9ef 0%)",
                }}
              >
                New Expense
              </Button>

              {/* User Profile Section - Moved to rightmost end */}
              {currentUser && (
                <Tooltip
                  title={
                    <Card elevation={3} sx={{ minWidth: 200, border: "none" }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 1.5,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              background:
                                "linear-gradient(135deg, #617effff 0%, #c68effff 100%)",
                              mr: 2,
                              fontSize: "1rem",
                              fontWeight: 600,
                            }}
                          >
                            {currentUser.name
                              ? (() => {
                                  const parts = currentUser.name
                                    .trim()
                                    .split(/\s+/);
                                  return (
                                    parts[0][0] +
                                    (parts.length > 1
                                      ? parts[parts.length - 1][0]
                                      : "")
                                  ).toUpperCase();
                                })()
                              : "E"}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 600,
                                color: "",
                                lineHeight: 1.2,
                                textTransform: "capitalize",
                              }}
                            >
                              {currentUser.name || "Employee"}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "text.secondary",
                                fontSize: "0.875rem",
                              }}
                            >
                              {currentUser.employeeCode || "EMP001"}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ pt: 1, borderTop: "1px solid #e1e4e8" }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontSize: "0.75rem",
                            }}
                          >
                            Role: {currentUser.role || "Employee"}
                          </Typography>
                          <br />
                        </Box>
                      </CardContent>
                    </Card>
                  }
                  arrow
                  placement="bottom-end"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        bgcolor: "transparent",
                        "& .MuiTooltip-arrow": {
                          color: "white",
                        },
                      },
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: "#ffffff",
                      color: "#000000",
                      ml: 2,
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      boxShadow: "rgba(0, 0, 0, 0.2) 0px 2px 4px 0px inset",
                    }}
                  >
                    {currentUser.name
                      ? (() => {
                          const parts = currentUser.name.trim().split(/\s+/);
                          return (
                            parts[0][0] +
                            (parts.length > 1 ? parts[parts.length - 1][0] : "")
                          ).toUpperCase();
                        })()
                      : "E"}
                  </Avatar>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1200, mx: "auto", px: 2, pb: 3 }}>
        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
          {summaryStats.map((stat, index) => (
            <Grid item xs={6} sm={2.4} key={index}>
              <Fade in timeout={300 + index * 100}>
                <Card
                  elevation={1}
                  sx={{
                    borderRadius: "8px",
                    background: stat.bg,
                    border: `1px solid ${stat.color}20`,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateY(-4px) scale(1.02)",
                      boxShadow: `0 20px 40px ${stat.color}20`,
                      borderColor: `${stat.color}40`,
                    },
                  }}
                  onClick={() =>
                    setActiveTab(
                      stat.label === "Total"
                        ? "all"
                        : stat.label.toLowerCase().replace(" ", "_")
                    )
                  }
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
                          transition: "transform 0.2s ease",
                          ".MuiCard-root:hover &": {
                            transform: "scale(1.1)",
                          },
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
              </Fade>
            </Grid>
          ))}
        </Grid>

        {/* Enhanced Tabs + Right-aligned Filters in the same row */}
        <Card
          elevation={0}
          sx={{
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "white",
            border: "1px solid #e1e4e8",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "stretch",
              gap: 2,
              borderBottom: "1px solid #e1e4e8",
              px: 2,
              // ensure single row
              flexWrap: "nowrap",
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{
                flex: 1, // take remaining space
                minWidth: 0, // allow shrinking
                "& .MuiTab-root": {
                  minHeight: 60,
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "0.875rem",
                  transition: "all 0.2s ease",
                  "&:hover": { transform: "translateY(-1px)" },
                },
                "& .Mui-selected": { color: "#0969da" },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#0969da",
                  height: 3,
                  borderRadius: "3px 3px 0 0",
                },
              }}
              variant="scrollable"
              scrollButtons="auto"
            >
              {tabs.map((tab) => (
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
                pl: 2, // little padding after the divider
                py: 1, // vertically center with tabs
              }}
            >
              <ExpenseFiltersMenuForEmployee
                filterType={filterType}
                setFilterType={setFilterType}
                filters={filters}
                setFilters={setFilters}
                compact
              />
            </Box>
          </Box>
        </Card>

        {/* Expense Submissions */}
        {filteredSubmissions.length === 0 ? (
          <Fade in timeout={500}>
            <Card
              elevation={1}
              sx={{
                borderRadius: "12px",
                border: "1px solid #e1e4e8",
                textAlign: "center",
                py: 8,
              }}
            >
              <CardContent>
                <Receipt
                  sx={{ fontSize: 64, color: "text.secondary", mb: 3 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {activeTab === "all"
                    ? "No expenses found"
                    : `No ${activeTab.replace("_", " ")} expenses`}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 4 }}
                >
                  {activeTab === "all"
                    ? "Get started by creating your first expense submission"
                    : `No expenses with ${activeTab.replace(
                        "_",
                        " "
                      )} status to display`}
                </Typography>
                {activeTab === "all" && (
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() =>
                      router.push("/employee/travel-expense/upload")
                    }
                    sx={{
                      borderRadius: "8px",
                      fontWeight: 600,
                      transition: "all 0.2s ease",
                      background: "linear-gradient(135deg, #4a7ef9ef 0%)",
                      "&:hover": {
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    Create New Expense
                  </Button>
                )}
              </CardContent>
            </Card>
          </Fade>
        ) : (
          <Grid container spacing={2}>
            {filteredSubmissions.map((submission, index) => {
              const submissionStatus = getSubmissionStatus(submission.expenses);
              const statusCounts = getStatusCounts(submission.expenses);
              const isExpanded = expandedSubmission === submission._id;

              return (
                <Grid item xs={12} key={submission._id}>
                  <Fade in timeout={300 + index * 50}>
                    <Card
                      elevation={1}
                      sx={{
                        border: "1px solid #e1e4e8",
                        borderRadius: "8px",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
                          transform: "translateY(-1px)",
                          borderColor: "#0969da",
                        },
                      }}
                    >
                      <CardContent
                        sx={{ p: 2, cursor: "pointer" }}
                        onClick={() => toggleExpanded(submission._id)}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography
                              variant="h6"
                              fontWeight={600}
                              sx={{
                                fontWeight: 800,
                                fontSize: "1.5rem",
                                lineHeight: 1,
                                mb: 2,
                                color:
                                  submissionStatus === "approved"
                                    ? "#1a7f37"
                                    : submissionStatus === "rejected"
                                    ? "#cf222e"
                                    : submissionStatus === "managerApproved"
                                    ? "#37bdfbff"
                                    : submissionStatus === "pending"
                                    ? "#bf8700"
                                    : "#1e293b",
                                fontFamily: '"SF Mono", "Monaco", monospace',
                              }}
                            >
                              ₹{submission.totalAmount?.toLocaleString()}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                my: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                {/* Status Chips with animations */}
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
                                      transition: "all 0.2s ease",
                                      "&:hover": {
                                        transform: "scale(1.05)",
                                      },
                                    }}
                                  />
                                )}
                                {submissionStatus === "managerApproved" && (
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
                                      transition: "all 0.2s ease",
                                      "&:hover": {
                                        transform: "scale(1.05)",
                                      },
                                    }}
                                  />
                                )}
                                {submission.status === "pending" && (
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
                                      transition: "all 0.2s ease",
                                      "&:hover": {
                                        transform: "scale(1.05)",
                                      },
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
                                      transition: "all 0.2s ease",
                                      "&:hover": {
                                        transform: "scale(1.05)",
                                      },
                                    }}
                                  />
                                )}

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
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                          transform: "scale(1.05)",
                                        },
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
                              }}
                            >
                              {submission.expenses.length} expenses •{" "}
                              {submission.isResubmitted
                                ? `Resubmitted: ${new Date(
                                    submission.updatedAt
                                  ).toLocaleString()}`
                                : `Submitted: ${new Date(
                                    submission.createdAt
                                  ).toLocaleString()}`}
                            </Typography>
                          </Box>
                          <IconButton
                            sx={{
                              transition: "transform 0.2s ease",
                              "&:hover": {
                                transform: "scale(1.1)",
                              },
                            }}
                          >
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Box>
                      </CardContent>

                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ borderTop: "1px solid #e1e4e8", p: 2 }}>
                          <TableContainer
                            component={Paper}
                            elevation={0}
                            sx={{
                              border: "1px solid #e1e4e8",
                              borderRadius: "8px",
                            }}
                          >
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "grey.50" }}>
                                  {[
                                    "Type",
                                    "Amount",
                                    "Description",
                                    "Period",
                                    "Purpose",
                                    "Attendees",
                                    "Status",
                                    "Actions",
                                  ].map((header) => (
                                    <TableCell
                                      key={header}
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {header}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {submission.expenses.map(
                                  (expense, expenseIndex) => (
                                    <Fade
                                      in
                                      timeout={200 + expenseIndex * 50}
                                      key={expense._id}
                                    >
                                      <TableRow hover>
                                        <TableCell>
                                          <Chip
                                            label={expense.expenseType}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                              transition: "all 0.2s ease",
                                              "&:hover": {
                                                transform: "scale(1.05)",
                                              },
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Typography
                                            variant="body2"
                                            fontWeight={600}
                                            sx={{
                                              fontFamily:
                                                '"SF Mono", "Monaco", monospace',
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
                                              sx={{ maxWidth: 200 }}
                                            >
                                              {expense.description}
                                            </Typography>
                                          </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                          <Typography
                                            variant="caption"
                                            display="block"
                                          >
                                            {new Date(
                                              expense.startDate
                                            ).toLocaleDateString()}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            display="block"
                                          >
                                            to{" "}
                                            {new Date(
                                              expense.endDate
                                            ).toLocaleDateString()}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Tooltip title={expense.description}>
                                            <Typography
                                              variant="body2"
                                              noWrap
                                              sx={{ maxWidth: 200 }}
                                            >
                                              {expense.purpose}
                                            </Typography>
                                          </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                          <Tooltip title={expense.description}>
                                            <Typography
                                              variant="body2"
                                              noWrap
                                              sx={{ maxWidth: 200 }}
                                            >
                                              {expense.attendees}
                                            </Typography>
                                          </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                          <Box>
                                            {/* Primary Status */}
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
                                                  transition: "all 0.2s ease",
                                                  "&:hover": {
                                                    transform: "scale(1.05)",
                                                  },
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
                                                  transition: "all 0.2s ease",
                                                  "&:hover": {
                                                    transform: "scale(1.05)",
                                                  },
                                                }}
                                              />
                                            )}

                                            {expense.status ===
                                              "managerApproved" && (
                                              <Chip
                                                label={"Manager Approved"}
                                                size="small"
                                                sx={{
                                                  background:
                                                    "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
                                                  color: "#0ea5e9",
                                                  border: "1px solid #0ea5e920",
                                                  borderRadius: "20px",
                                                  fontWeight: 600,
                                                  mb: 1,
                                                  fontSize: "0.7rem",
                                                  transition: "all 0.2s ease",
                                                  "&:hover": {
                                                    transform: "scale(1.05)",
                                                  },
                                                }}
                                              />
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
                                                  transition: "all 0.2s ease",
                                                  "&:hover": {
                                                    transform: "scale(1.05)",
                                                  },
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
                                              {expense.managerApproval
                                                ?.status === "approved" && (
                                                <Chip
                                                  icon={<SupervisorAccount />}
                                                  label="Manager ✓"
                                                  size="small"
                                                  sx={{
                                                    backgroundColor:
                                                      "rgba(59, 130, 246, 0.1)",
                                                    color: "#3b82f6",
                                                    fontWeight: 500,
                                                    fontSize: "0.6875rem",
                                                    transition: "all 0.2s ease",
                                                    "&:hover": {
                                                      transform: "scale(1.05)",
                                                    },
                                                  }}
                                                />
                                              )}
                                              {expense.financeApproval
                                                ?.status === "approved" && (
                                                <Chip
                                                  icon={<AccountBalance />}
                                                  label="Finance ✓"
                                                  size="small"
                                                  sx={{
                                                    backgroundColor:
                                                      "rgba(16, 185, 129, 0.1)",
                                                    color: "#10b981",
                                                    fontWeight: 500,
                                                    fontSize: "0.6875rem",
                                                    transition: "all 0.2s ease",
                                                    "&:hover": {
                                                      transform: "scale(1.05)",
                                                    },
                                                  }}
                                                />
                                              )}

                                              {expense.isEdited && (
                                                <Chip
                                                  label="Edited"
                                                  size="small"
                                                  sx={{
                                                    backgroundColor:
                                                      "rgba(245, 158, 11, 0.1)",
                                                    color: "#f59e0b",
                                                    fontWeight: 500,
                                                    fontSize: "0.6875rem",
                                                    transition: "all 0.2s ease",
                                                    "&:hover": {
                                                      transform: "scale(1.05)",
                                                    },
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
                                                    display="block"
                                                    sx={{
                                                      mt: 0.5,
                                                      cursor: "pointer",
                                                      transition:
                                                        "all 0.2s ease",
                                                      "&:hover": {
                                                        textDecoration:
                                                          "underline",
                                                      },
                                                    }}
                                                  >
                                                    View reason
                                                  </Typography>
                                                </Tooltip>
                                              )}
                                          </Box>
                                        </TableCell>
                                        <TableCell>
                                          <Box
                                            sx={{ display: "flex", gap: 0.5 }}
                                          >
                                            {expense.files &&
                                              expense.files.length > 0 && (
                                                <Tooltip title="View Receipt">
                                                  <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleViewDocument(
                                                        expense
                                                      );
                                                    }}
                                                    sx={{
                                                      color: "info.main",
                                                      transition:
                                                        "all 0.2s ease",
                                                      "&:hover": {
                                                        transform: "scale(1.1)",
                                                        color: "info.dark",
                                                      },
                                                    }}
                                                  >
                                                    <Visibility fontSize="small" />
                                                  </IconButton>
                                                </Tooltip>
                                              )}
                                            {(expense.status === "pending" ||
                                              expense.status ===
                                                "rejected") && (
                                              <Tooltip title="Edit Expense">
                                                <IconButton
                                                  size="small"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditExpense(expense);
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
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    </Fade>
                                  )
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      </Collapse>
                    </Card>
                  </Fade>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Enhanced Edit Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "12px",
              transition: "all 0.3s ease",
            },
          }}
          TransitionComponent={Fade}
        >
          {selectedExpense && (
            <>
              <DialogTitle sx={{ borderBottom: "1px solid #e1e4e8", pb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar
                    sx={{
                      bgcolor: `${getStatusColor(selectedExpense.status)}.main`,
                      mr: 2,
                      fontWeight: 600,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.16)",
                      transition: "transform 0.2s ease",
                      "&:hover": {
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    <Edit />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      Edit Expense
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Modify expense details and resubmit for review
                    </Typography>
                  </Box>
                </Box>
              </DialogTitle>

              <DialogContent sx={{ pt: "20px !important" }}>
                <Grid container spacing={3}>
                  {/* Rejection Comments */}
                  {selectedExpense.adminComments &&
                    selectedExpense.status === "rejected" && (
                      <Grid item xs={12}>
                        <Alert
                          severity="error"
                          sx={{
                            borderRadius: "8px",
                            border: "1px solid #fee2e2",
                          }}
                        >
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
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                          },
                        }}
                      >
                        {[
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
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                        },
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
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Travel Start Date"
                      type="date"
                      value={
                        new Date(editFormData.startDate)
                          .toISOString()
                          .split("T")[0]
                      }
                      onChange={(e) =>
                        handleFormChange("startDate", e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Travel End Date"
                      type="date"
                      value={
                        new Date(editFormData.endDate)
                          .toISOString()
                          .split("T")[0]
                      }
                      onChange={(e) =>
                        handleFormChange("endDate", e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                        },
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
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                        },
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
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                        },
                      }}
                    />
                  </Grid>

                  {/* Current File Display */}
                  {selectedExpense.files.name && !newFile && (
                    <Grid item xs={12}>
                      <Card
                        sx={{
                          bgcolor: "grey.50",
                          border: "1px solid #e1e4e8",
                          borderRadius: "8px",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                          },
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
                            <Avatar
                              sx={{
                                bgcolor: "primary.main",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.16)",
                              }}
                            >
                              {getFileIcon(selectedExpense.files.name)}
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
                                sx={{
                                  fontWeight: 550,
                                  textTransform: "uppercase",
                                }}
                              >
                                {selectedExpense.files.name}
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                handleViewDocument(selectedExpense)
                              }
                              sx={{
                                borderRadius: "6px",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  transform: "translateY(-1px)",
                                },
                              }}
                            >
                              View
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {/* Enhanced File Upload */}
                  <Grid item xs={12}>
                    <Card
                      elevation={newFile ? 1 : 0}
                      sx={{
                        border: newFile
                          ? `${newFile.size <= 1048576 ? "#22c55e" : "#dc2626"}`
                          : "2px dashed #cbd5e1",
                        bgcolor: newFile
                          ? newFile.size <= 1048576
                            ? "#f0fdf4"
                            : "#fdf0f1ff"
                          : "#fafbfc",
                        borderRadius: "12px",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: newFile
                            ? newFile.size <= 1048576
                              ? "#16a34a"
                              : "#dc2626"
                            : "#94a3b8",
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        {!newFile ? (
                          <Box sx={{ textAlign: "center" }}>
                            <CloudUpload
                              sx={{
                                fontSize: 48,
                                color: "text.secondary",
                                mb: 1,
                                transition: "transform 0.2s ease",
                                "&:hover": {
                                  transform: "scale(1.1)",
                                },
                              }}
                            />
                            <Typography variant="h6" sx={{ mb: 1 }}>
                              {selectedExpense.files?.name
                                ? "Upload New Receipt"
                                : "Upload Receipt"}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 2 }}
                            >
                              Choose a file to upload (JPEG, PNG, PDF • Max 1MB)
                            </Typography>
                            <Button
                              component="label"
                              variant="outlined"
                              startIcon={<CloudUpload />}
                              sx={{
                                borderRadius: "8px",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  transform: "translateY(-1px)",
                                },
                              }}
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
                            <Avatar
                              sx={{
                                bgcolor:
                                  newFile.size > 1048576
                                    ? "#dc2626"
                                    : "#22c55e",
                                color: "white",
                              }}
                            >
                              {getFileIcon(newFile.name)}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography
                                variant="subtitle1"
                                color={
                                  newFile.size > 1048576 ? "#dc2626" : "#22c55e"
                                }
                                fontWeight={600}
                              >
                                {newFile.size <= 1048576
                                  ? newFile.name
                                  : "File size exceeds 1MB"}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {newFile.size <= 1048576
                                  ? formatFileSize(newFile.size)
                                  : ""}
                              </Typography>
                            </Box>
                            <Button
                              component="label"
                              variant="outlined"
                              size="small"
                              sx={{
                                borderRadius: "6px",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  transform: "translateY(-1px)",
                                },
                              }}
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
                              sx={{
                                color: "error.main",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  transform: "scale(1.1)",
                                  color: "error.dark",
                                },
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </DialogContent>

              <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button
                  onClick={handleCloseEditDialog}
                  disabled={editLoading}
                  sx={{
                    borderRadius: "8px",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-1px)",
                    },
                  }}
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
                    "&:disabled": {
                      transform: "none",
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
