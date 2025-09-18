// pages/employee/index.js

import {
  Add,
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
  TrendingUp,
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
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";

import { AccountBalance } from "@mui/icons-material";
import { SupervisorAccount } from "@mui/icons-material";
import axiosInstance from "@/utils/helpers";
import { useRouter } from "next/navigation";

export default function ExpenseIndex() {
  const [bulkSubmissions, setBulkSubmissions] = useState([]);
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    expenseType: "",
    amount: "",
    description: "",
    travelStartDate: "",
    travelEndDate: "",
  });
  const [newFile, setNewFile] = useState(null);

  const router = useRouter();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login first");
        return;
      }

      const response = await axiosInstance.get("/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setBulkSubmissions(response.data.data);
      } else {
        setError("Failed to fetch expenses");
      }
    } catch (err) {
      console.error("Error fetching expenses:", err);
      setError("Failed to load expenses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      approved: "success",
      rejected: "error",
      pending: "warning",
      manager_approved: "info",
    };
    return colors[status] || "default";
  };


  const getSubmissionStatus = (expenses) => {
    const statuses = expenses.map((exp) => exp.status);
    if (statuses.every((status) => status === "approved")) return "approved";
    if (statuses.some((status) => status === "rejected")) return "rejected";
    if (statuses.some((status) => status === "manager_approved"))
      return "manager_approved";
    return "pending";
  };

  const getStatusCounts = (expenses) => {
    return expenses.reduce((acc, exp) => {
      acc[exp.status] = (acc[exp.status] || 0) + 1;
      return acc;
    }, {});
  };

  const calculateTotals = () => {
    const allExpenses = bulkSubmissions.flatMap(
      (submission) => submission.expenses
    );
    return allExpenses.reduce(
      (acc, expense) => {
        const amount = parseFloat(expense.amount) || 0;
        acc.total += amount;
        acc[expense.status] = (acc[expense.status] || 0) + amount;
        return acc;
      },
      { total: 0, approved: 0, pending: 0, rejected: 0, manager_approved: 0 }
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
      travelStartDate: expense.travelStartDate,
      travelEndDate: expense.travelEndDate,
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

      const response = await axiosInstance.put(
        `/expenses/${selectedExpense._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
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
      expenseType: "",
      amount: "",
      description: "",
      travelStartDate: "",
      travelEndDate: "",
    });
  };

  const handleViewDocument = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axiosInstance.get(`/expenses/${id}/fileData`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const expense = response.data;
      if (expense.fileData) {
        const byteCharacters = atob(expense.fileData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: expense.fileType });

        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        alert("No document found for this expense");
      }
    } catch (error) {
      alert("Error viewing document: " + error.message);
    }
  };

  const isFormValid = () => {
    return (
      editFormData.expenseType &&
      editFormData.amount &&
      parseFloat(editFormData.amount) > 0 &&
      editFormData.description &&
      editFormData.travelStartDate &&
      editFormData.travelEndDate &&
      new Date(editFormData.travelStartDate) <=
        new Date(editFormData.travelEndDate)
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
      icon: TrendingUp,
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
      value: totals.manager_approved || 0,
      icon: Schedule,
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
      {/* Header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: "auto", px: 2, py: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                sx={{ width: 40, height: 40, mr: 2, bgcolor: "primary.main" }}
              >
                <Receipt />
              </Avatar>
              <Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: "text.primary" }}
                >
                  My Expenses
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Track your expense submissions
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                sx={{ color: "primary.light" }}
                onClick={() => router.push("/main")}
              >
                <Home />
              </IconButton>
              <IconButton
                sx={{ color: "error.main" }}
                onClick={() => {
                  localStorage.removeItem("user");
                  localStorage.removeItem("token");
                  router.push("/login");
                }}
              >
                <Logout />
              </IconButton>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => router.push("/employee/travel-expense/upload")}
                sx={{ borderRadius: "8px", fontWeight: 600 }}
              >
                New Expense
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1200, mx: "auto", px: 2, pb: 3 }}>
        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
          {summaryStats.map((stat, index) => (
            <Grid item xs={6} sm={2.4} key={index}>
              <Card
                elevation={1}
                sx={{
                  borderRadius: "8px",
                  background: stat.bg,
                  border: `1px solid ${stat.color}20`,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: `0 12px 24px ${stat.color}15`,
                  },
                }}
              >
                <CardContent sx={{ p: 2.5, textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1,
                    }}
                  >
                    <stat.icon
                      sx={{ fontSize: 20, color: stat.color, mr: 1 }}
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

        {/* Expense Submissions */}
        {bulkSubmissions.length === 0 ? (
          <Card
            elevation={1}
            sx={{
              borderRadius: "8px",
              border: "1px solid #e1e4e8",
              textAlign: "center",
              py: 6,
            }}
          >
            <CardContent>
              <Receipt sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No expenses found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Get started by creating your first expense submission
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => router.push("/employee/travel-expense/upload")}
                sx={{ borderRadius: "8px", fontWeight: 600 }}
              >
                Create First Expense
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {bulkSubmissions.map((submission) => {
              const submissionStatus = getSubmissionStatus(submission.expenses);
              const statusCounts = getStatusCounts(submission.expenses);
              const isExpanded = expandedSubmission === submission._id;

              return (
                <Grid item xs={12} key={submission._id}>
                  <Card
                    elevation={1}
                    sx={{
                      border: "1px solid #e1e4e8",
                      "&:hover": { boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" },
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
                              fontWeight: 700,
                              color: "red",
                              fontSize: "1.5rem",
                              lineHeight: 1,
                              fontWeight: 800,
                              mb: 2,
                              color:
                                submissionStatus === "approved"
                                  ? "#1a7f37"
                                  : submissionStatus === "rejected"
                                  ? "#cf222e"
                                  : submissionStatus === "manager_approved"
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
                                      }}
                                    />
                                  )}
                                  {submissionStatus === "manager_approved" && (
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
                          <Typography variant="body2" color="text.secondary" sx={{ fontFamily:'"SF Mono", "Monaco", monospace'}}>
                            {submission.expenses.length} expenses •{" "}
                            {submission.isResubmitted
                              ? `Resubmitted: ${new Date(
                                  submission.resubmittedAt ||
                                    submission.submittedAt
                                ).toLocaleString()}`
                              : `Submitted: ${new Date(
                                  submission.submittedAt
                                ).toLocaleString()}`}
                          </Typography>
                        </Box>
                        <IconButton>
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>
                    </CardContent>

                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ borderTop: "1px solid #e1e4e8", p: 2 }}>
                        <TableContainer
                          component={Paper}
                          elevation={0}
                          sx={{ border: "1px solid #e1e4e8" }}
                        >
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: "grey.50" }}>
                                {[
                                  "Type",
                                  "Amount",
                                  "Description",
                                  "Period",
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
                              {submission.expenses.map((expense) => (
                                <TableRow key={expense._id} hover>
                                  <TableCell>
                                    <Chip
                                      label={expense.expenseType}
                                      size="small"
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography
                                      variant="body2"
                                      fontWeight={600}
                                    >
                                      ₹
                                      {parseFloat(
                                        expense.amount
                                      ).toLocaleString()}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography
                                      variant="body2"
                                      noWrap
                                      sx={{ maxWidth: 200 }}
                                    >
                                      {expense.description}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography
                                      variant="caption"
                                      display="block"
                                    >
                                      {new Date(
                                        expense.travelStartDate
                                      ).toLocaleDateString()}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      display="block"
                                    >
                                      to{" "}
                                      {new Date(
                                        expense.travelEndDate
                                      ).toLocaleDateString()}
                                    </Typography>
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

                                          {/* Minimal Additional Status Info */}
                                          <Box
                                            sx={{
                                              display: "flex",
                                              flexWrap: "wrap",
                                              gap: 0.5,
                                            }}
                                          >
                                            {expense.managerApproval?.status ===
                                              "approved" && (
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
                                                }}
                                              />
                                            )}
                                            {expense.financeApproval?.status ===
                                              "approved" && (
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
                                                }}
                                              />
                                            )}

                                            {/* Subtle Edit indicators */}
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
                                                }}
                                              />
                                            )}
                                          </Box>

                                          {/* Rejection comments */}
                                          {expense.comments &&
                                            expense.status === "rejected" && (
                                              <Tooltip title={expense.comments}>
                                                <Typography
                                                  variant="caption"
                                                  color="error"
                                                  display="block"
                                                  sx={{
                                                    mt: 0.5,
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
                                      {expense.fileName && (
                                        <Tooltip title="View Receipt">
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleViewDocument(expense._id);
                                            }}
                                            sx={{ color: "info.main" }}
                                          >
                                            <Visibility fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      {(expense.status === "pending" ||
                                        expense.status === "rejected") && (
                                        <Tooltip title="Edit Expense">
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEditExpense(expense);
                                            }}
                                            sx={{ color: "warning.main" }}
                                          >
                                            <Edit fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </Collapse>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Edit Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: "12px" } }}
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
                    }}
                  >
                    <Edit />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">Edit Expense</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Modify expense details and resubmit for review
                    </Typography>
                  </Box>
                </Box>
              </DialogTitle>

              <DialogContent sx={{ pt: "20px !important" }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Expense Type</InputLabel>
                      <Select
                        value={editFormData.expenseType}
                        label="Expense Type"
                        onChange={(e) =>
                          handleFormChange("expenseType", e.target.value)
                        }
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
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Travel Start Date"
                      type="date"
                      value={editFormData.travelStartDate}
                      onChange={(e) =>
                        handleFormChange("travelStartDate", e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Travel End Date"
                      type="date"
                      value={editFormData.travelEndDate}
                      onChange={(e) =>
                        handleFormChange("travelEndDate", e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  {/* Current File Display */}
                  {selectedExpense.fileName && !newFile && (
                    <Grid item xs={12}>
                      <Card
                        sx={{ bgcolor: "grey.50", border: "1px solid #e1e4e8" }}
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
                              {getFileIcon(selectedExpense.fileName)}
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
                                {selectedExpense.fileName}
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                handleViewDocument(selectedExpense._id)
                              }
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
                        border: newFile ? "none" : "2px dashed #cbd5e1",
                        bgcolor: newFile ? "#f0fdf4" : "#fafbfc",
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
                              {selectedExpense.fileName
                                ? "Upload New Receipt"
                                : "Upload Receipt"}
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

                  {/* Rejection Comments */}
                  {selectedExpense.comments &&
                    selectedExpense.status === "rejected" && (
                      <Grid item xs={12}>
                        <Alert severity="error">
                          <Typography variant="subtitle2" gutterBottom>
                            Rejection Reason:
                          </Typography>
                          <Typography variant="body2">
                            {selectedExpense.comments}
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
                </Grid>
              </DialogContent>

              <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button onClick={handleCloseEditDialog} disabled={editLoading}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveExpense}
                  variant="contained"
                  disabled={!isFormValid() || editLoading}
                  startIcon={
                    editLoading ? <CircularProgress size={16} /> : <Edit />
                  }
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
