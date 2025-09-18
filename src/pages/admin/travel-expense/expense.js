// src/pages/admin/travel-expense/expense.js
"use client";

import {
  AccountBalance,
  AdminPanelSettings,
  Assessment,
  Cancel,
  CheckCircle,
  Comment,
  Description,
  Edit,
  ExpandLess,
  ExpandMore,
  Home,
  Logout,
  PendingActions,
  Person,
  Receipt,
  Schedule,
  SupervisorAccount,
  ThumbDown,
  ThumbUp,
  TrendingUp,
  VerifiedUser,
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
  Divider,
  Fade,
  Grid,
  IconButton,
  Paper,
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
import { useEffect, useState } from "react";

import axiosInstance from "@/utils/helpers";
import { useRouter } from "next/navigation";

export default function AdminExpenses() {
  const router = useRouter();
  const [bulkSubmissions, setBulkSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [initialLoad, setInitialLoad] = useState(false);
  const [actionDialog, setActionDialog] = useState({
    open: false,
    expense: null,
    submission: null,
    action: "",
    type: "individual", // individual or bulk
  });
  const [comments, setComments] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user info
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(user);
  }, []);

  const statusTabs = [
    { value: "all", label: "All", icon: <Assessment />, color: "primary" },
    {
      value: "pending",
      label: "Pending",
      icon: <Schedule />,
      color: "warning",
    },
    {
      value: "manager_approved",
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
    { value: "rejected", label: "Rejected", icon: <Cancel />, color: "error" },
  ];

  const fetchExpenses = async (status = "pending") => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login first");
        return;
      }

      const response = await axiosInstance.get("/admin/expenses", {
        headers: { Authorization: `Bearer ${token}` },
        params: { status },
      });

      setBulkSubmissions(response.data.bulkSubmissions || []);
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setError(error.response?.data?.error || "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

// Initial load - get stats
useEffect(() => {
  const fetchInitialData = async () => {
     const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login first");
        return;
      }
    const response = await axiosInstance.get("/admin/expenses", {
      headers: { Authorization: `Bearer ${token}` },
      params: { 
        status: "pending", 
        includeStats: "true"  // Only on first load
      },
    });
    setBulkSubmissions(response.data.bulkSubmissions || []);
    setStats(response.data.stats);
  };
  
  fetchInitialData();
}, []);

// Tab changes - no stats
useEffect(() => {
  if (activeTab !== "all") { // Skip initial tab since already loaded above
    fetchExpenses(activeTab);
  }
}, [activeTab]);

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

  // Handle individual expense action
  const handleIndividualAction = async () => {
    try {
      const token = localStorage.getItem("token");
      const endpoint =
        currentUser?.role === "manager"
          ? `/expenses/${actionDialog.expense._id}/manager-review`
          : `/expenses/${actionDialog.expense._id}/finance-review`;

      await axiosInstance.patch(
        endpoint,
        {
          action: actionDialog.action,
          comments: comments,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`Expense ${actionDialog.action} successfully!`);
      setActionDialog({
        open: false,
        expense: null,
        submission: null,
        action: "",
        type: "individual",
      });
      setComments("");
      fetchExpenses(activeTab);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    }
  };

  // Handle bulk submission action
  const handleBulkAction = async () => {
    try {
      const token = localStorage.getItem("token");
      const endpoint =
        currentUser?.role === "manager"
          ? `/bulk-submissions/${actionDialog.submission._id}/manager-review`
          : `/bulk-submissions/${actionDialog.submission._id}/finance-review`;

      await axiosInstance.patch(
        endpoint,
        {
          action: actionDialog.action,
          comments: comments,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`Submission ${actionDialog.action} successfully!`);
      setActionDialog({
        open: false,
        expense: null,
        submission: null,
        action: "",
        type: "bulk",
      });
      setComments("");
      fetchExpenses(activeTab);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    }
  };

  const viewDocument = async (id) => {
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
        setError("No document found for this expense");
      }
    } catch (error) {
      setError("Error viewing document: " + error.message);
    }
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

  const toggleExpanded = (submissionId) => {
    setExpandedSubmission(
      expandedSubmission === submissionId ? null : submissionId
    );
  };

  const calculateTotals = () => {
  const allExpenses = bulkSubmissions.flatMap(
  (submission) => Array.isArray(submission.expenses) ? submission.expenses : []
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
        if (expense.status === "manager_approved")
          acc.manager_approved += parseFloat(expense.amount) || 0;
        return acc;
      },
      { total: 0, approved: 0, pending: 0, rejected: 0, manager_approved: 0 }
    );
  };

  // Check if user can perform bulk actions on a submission
  const canPerformBulkAction = (submission) => {
    if (currentUser?.role === "manager") {
      // Manager can approve/reject submissions where all expenses are pending
      return submission.expenses.every((exp) => exp.status === "pending");
    } else if (currentUser?.role === "finance") {
      // Finance can approve/reject submissions where all expenses are manager_approved
      return submission.expenses.every(
        (exp) => exp.status === "manager_approved"
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
        expense.status === "manager_approved" || expense.status === "pending"
      );
    }
    return false;
  };

  const totals = calculateTotals();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        position: "relative",
      }}
    >
      {/* New UI Navbar - Clean and Modern */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backgroundColor: "white",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
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
                  {currentUser?.role === "finance" ? "Finance" : currentUser?.role === "manager" ? "Manager" : "Admin"}{" "}
                  Dashboard
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
                  Expense review and approval
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Chip
                icon={
                  currentUser?.role === "finance" ? (
                    <AccountBalance />
                  ) : (
                    <SupervisorAccount />
                  )
                }
                label={currentUser?.role?.toUpperCase()}
                sx={{
                  backgroundColor:
                    currentUser?.role === "finance"
                      ? "rgba(16, 185, 129, 0.1)"
                      : "rgba(59, 130, 246, 0.1)",
                  color:
                    currentUser?.role === "finance" ? "#10b981" : "#3b82f6",
                  border: `1px solid ${
                    currentUser?.role === "finance" ? "#10b981" : "#3b82f6"
                  }20`,
                  fontWeight: 600,
                }}
              />
              <Tooltip title="Home">
                <IconButton
                  onClick={handleHome}
                  sx={{
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    color: "#3b82f6",
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
                    backgroundColor: "rgba(143, 59, 246, 0.1)",
                    color: "#413bf6ff",
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
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
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

        {/* Original UI Stats Cards with Gradients */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              {
                label: "Total Expenses",
                value: totals.total,
                icon: TrendingUp,
                color: "#0969da",
                bg: "linear-gradient(135deg, #dbeafe 0%, #f0f9ff 100%)",
                border: "#0969da",
              },
              {
                label: "Pending Review",
                value: totals.pending,
                icon: Schedule,
                color: "#bf8700",
                bg: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
                border: "#bf8700",
              },
              {
                label: "Manager Approved",
                value: totals.manager_approved || 0,
                icon: SupervisorAccount,
                color: "#0ea5e9",
                bg: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
                border: "#0ea5e9",
              },
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
              <Grid item xs={6} sm={2.4} key={index}>
                <Card
                  elevation={1}
                  sx={{
                    borderRadius: "8px",
                    background: stat.bg,
                    border: `1px solid ${stat.border}20`,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: `0 12px 24px ${stat.border}15`,
                      borderColor: `${stat.border}40`,
                    },
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
        )}

        {/* Main Content Card */}
        <Card
          elevation={0}
          sx={{
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "white",
            border: "1px solid #e1e4e8",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            display: "flex",
            flexDirection: "column",
            height: "calc(100vh - 360px)",
          }}
        >
          {/* Filter Tabs */}
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: "1px solid #e1e4e8",
              px: 2,
              flexShrink: 0,
              "& .MuiTab-root": {
                minHeight: 60,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.875rem",
              },
              "& .Mui-selected": {
                color: "#0969da",
              },
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

          <CardContent
            sx={{
              p: 2,
              flex: 1,
              overflowY: "auto",
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f1f3f4",
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#c1c8cd",
                borderRadius: "3px",
                "&:hover": {
                  backgroundColor: "#a8b1ba",
                },
              },
            }}
          >
            {/* Loading State */}
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress size={40} />
              </Box>
            ) : bulkSubmissions.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <PendingActions
                  sx={{ fontSize: 64, color: "grey.300", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No expense submissions found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No {activeTab === "all" ? "" : activeTab} expense submissions
                  to display
                </Typography>
              </Box>
            ) : (
              /* Original Style Submission Cards with Improvements */
              <Grid container spacing={2}>
                {bulkSubmissions.map((submission) => {
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
                            transform: "translateY(-1px)",
                            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
                            borderColor: "#0969da",
                          },
                        }}
                      >
                        {/* Improved Card Header with Prominent Amount */}
                        <CardContent
                          sx={{ p: 2, cursor: "pointer" }}
                          onClick={() => toggleExpanded(submission._id)}
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
                                  {submission.employeeName}
                                </Typography>
                                {/* Subtle Employee Code */}
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
                                {/* Reduced and Subtle Chips */}
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
                                         fontSize: "0.7rem"
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
                                      submission.resubmittedAt ||
                                        submission.submittedAt
                                    ).toLocaleString()}`
                                  : `Submitted: ${new Date(
                                      submission.submittedAt
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
                                        {/* Amount with Status Color */}
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
                                            expense.travelStartDate
                                          ).toLocaleDateString()}
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          display="block"
                                        >
                                          to{" "}
                                          {new Date(
                                            expense.travelEndDate
                                          ).toLocaleDateString()}
                                        </Typography>
                                      </TableCell>
                                      <TableCell noWrap sx={{ minWidth: 200 }}>
                                        <Box>
                                          {/* Primary Status */}
                                          {expense.status === "approved" && (
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
                                                mb: 1,
                                                 fontSize: "0.7rem"
                                              }}
                                            />
                                          )}

                                          {expense.status === "pending" && (
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
                                                mb: 1,
                                                fontSize: "0.7rem"
                                              }}
                                            />
                                          )}
                                          {expense.status === "rejected" && (
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
                                                  fontSize: "0.7rem",
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
                                            {expense.isEdited && (
                                              <Chip
                                                label="Edited"
                                                size="small"
                                                sx={{
                                                  backgroundColor:
                                                    "rgba(245, 158, 11, 0.1)",
                                                  color: "#f59e0b",
                                                  fontWeight: 500,
                                                  fontSize: "0.7rem",
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
                                          {/* Only View Document Button */}
                                          {expense.fileName && (
                                            <Tooltip title="View Receipt">
                                              <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  viewDocument(expense._id);
                                                }}
                                                sx={{ color: "info.main" }}
                                              >
                                                <Visibility fontSize="small" />
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
                                                      submission: null,
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
                                                      submission: null,
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
                                    submission.originalSubmittedAt ||
                                      submission.submittedAt
                                  ).toLocaleString()}{" "}
                                  • Resubmitted:{" "}
                                  {new Date(
                                    submission.resubmittedAt ||
                                      submission.submittedAt
                                  ).toLocaleString()}
                                </Typography>
                              </Box>
                            )}

                            {/* Bulk Action Buttons at Bottom for All Roles */}
                            {canPerformBulkAction(submission) && (
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  gap: 2,
                                  p: 2,
                                }}
                              >
                                {currentUser?.role === "manager" ? (
                                  // Manager sees gradient APPROVE/REJECT buttons
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
                                          action: "approved",
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
                                ) : (
                                  <>
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
                    actionDialog.action === "approved"
                      ? "success.main"
                      : "error.main",
                  mr: 2,
                }}
              >
                {actionDialog.action === "approved" ? (
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
                  {actionDialog.action === "approved" ? "Approve" : "Reject"}{" "}
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
                    {actionDialog.expense.travelStartDate
                      ? new Date(
                          actionDialog.expense.travelStartDate
                        ).toLocaleDateString()
                      : "Not available"}{" "}
                    -{" "}
                    {actionDialog.expense.travelEndDate
                      ? new Date(
                          actionDialog.expense.travelEndDate
                        ).toLocaleDateString()
                      : "Not available"}
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
                    {actionDialog.action === "approved" ? "Approve" : "Reject"}{" "}
                    all expenses in this submission
                  </Typography>
                </Paper>
              )}

              {/* Approval History */}
              {actionDialog.expense?.managerApproval && (
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
                  {actionDialog.expense.managerApproval.status ===
                    "approved" && (
                    <Typography variant="body2" color="info.dark">
                      <strong>Manager:</strong> Approved by{" "}
                      {actionDialog.expense.managerApproval.reviewedByName} on{" "}
                      {new Date(
                        actionDialog.expense.managerApproval.reviewedAt
                      ).toLocaleDateString()}
                    </Typography>
                  )}
                </Paper>
              )}

              {/* Comments Field */}
              <TextField
                label={
                  actionDialog.action === "approved"
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
                  actionDialog.action === "approved"
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
              onClick={
                actionDialog.type === "bulk"
                  ? handleBulkAction
                  : handleIndividualAction
              }
              color={actionDialog.action === "approved" ? "success" : "error"}
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
              {actionDialog.action === "approved"
                ? `${
                    currentUser?.role === "manager" ? "Manager" : "Finance"
                  } Approve ${actionDialog.type === "bulk" ? "All" : "Expense"}`
                : `${
                    currentUser?.role === "manager" ? "Manager" : "Finance"
                  } Reject ${actionDialog.type === "bulk" ? "All" : "Expense"}`}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
