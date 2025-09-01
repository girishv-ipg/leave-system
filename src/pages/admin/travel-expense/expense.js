// src/pages/admin/travel-expense/expense.js
"use client";

import {
  AdminPanelSettings,
  Assessment,
  AttachMoney,
  CalendarToday,
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
  ThumbDown,
  ThumbUp,
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
  const [activeTab, setActiveTab] = useState("pending");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [actionDialog, setActionDialog] = useState({
    open: false,
    expense: null,
    action: "",
  });
  const [comments, setComments] = useState("");

  const statusTabs = [
    { value: "all", label: "All", icon: <Assessment />, color: "primary" },
    {
      value: "pending",
      label: "Pending",
      icon: <Schedule />,
      color: "warning",
    },
    {
      value: "approved",
      label: "Approved",
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

      // Modified API call to get bulk submissions
      const response = await axiosInstance.get("/admin/expenses", {
        headers: { Authorization: `Bearer ${token}` },
        params: { status },
      });
      console.log(
        "Bulk submissions response => ",
        response.data.bulkSubmissions
      );
      setBulkSubmissions(response.data.bulkSubmissions || []);
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setError(error.response?.data?.error || "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses(activeTab);
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleHome = () => {
    router.push("/main");
  };

  const handleAction = async () => {
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.patch(
        `/expenses/${actionDialog.expense._id}/status`,
        {
          status: actionDialog.action,
          comments: comments,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`Expense ${actionDialog.action} successfully!`);
      setActionDialog({ open: false, expense: null, action: "" });
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

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle />;
      case "rejected":
        return <Cancel />;
      case "pending":
        return <Schedule />;
      default:
        return <Assessment />;
    }
  };

  const getSubmissionStatus = (expenses) => {
    const statuses = expenses.map((exp) => exp.status);
    if (statuses.every((status) => status === "approved")) return "approved";
    if (statuses.some((status) => status === "rejected")) return "rejected";
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
      (submission) => submission.expenses
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
        return acc;
      },
      { total: 0, approved: 0, pending: 0, rejected: 0 }
    );
  };

  const totals = calculateTotals();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#fafbfc",
        position: "relative",
      }}
    >
      {/* Sticky Header with Glassmorphism */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backdropFilter: "blur(20px)",
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box sx={{ maxWidth: 1400, mx: "auto", px: 2, py: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Left side - Title and Avatar */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  mr: 2,
                  bgcolor: "primary.main",
                  fontSize: "1.25rem",
                }}
              >
                <AdminPanelSettings />
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
                  Travel Expense Management
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 0.5 }}
                >
                  Review and manage employee expense submissions
                </Typography>
              </Box>
            </Box>

            {/* Right side - Action buttons */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title="Home">
                <IconButton
                  onClick={handleHome}
                  sx={{
                    color: "primary.light",
                    "&:hover": {
                      backgroundColor: "rgba(25, 118, 210, 0.08)",
                    },
                  }}
                >
                  <Home />
                </IconButton>
              </Tooltip>
              <Tooltip title="Logout">
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    color: "error.main",
                    "&:hover": {
                      backgroundColor: "rgba(211, 47, 47, 0.08)",
                    },
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
              sx={{
                mb: 3,
                borderRadius: "8px",
                fontSize: "0.9rem",
              }}
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
              sx={{
                mb: 3,
                borderRadius: "8px",
                fontSize: "0.9rem",
              }}
              onClose={() => setSuccess("")}
            >
              {success}
            </Alert>
          </Fade>
        )}

        {/* GitHub-style Professional Stats Cards */}
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
                label: "Approved",
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
              <Grid item xs={6} sm={3} key={index}>
                <Card
                  elevation={0}
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
            height: "calc(100vh - 280px)",
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
              /* Bulk Submission Cards */
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
                        elevation={0}
                        sx={{
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          "&:hover": {
                            transform: "translateY(-1px)",
                            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
                            borderColor: "#0969da",
                          },
                        }}
                      >
                        {/* Main Card Header */}
                        <CardContent
                          sx={{ p: 2, cursor: "pointer" }}
                          onClick={() => toggleExpanded(submission._id)}
                        >
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: `${getStatusColor(
                                  submissionStatus
                                )}.main`,
                                mr: 2,
                              }}
                            >
                              {getStatusIcon(submissionStatus)}
                            </Avatar>

                            <Box sx={{ flexGrow: 1 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Typography variant="h6" fontWeight={600}>
                                  {submission.employeeName} (
                                  {submission.employeeCode})
                                </Typography>
                                {submission.isResubmitted && (
                                  <Chip
                                    label="RESUBMITTED"
                                    size="small"
                                    color="info"
                                    variant="filled"
                                    sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                                  />
                                )}
                              </Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {submission.expenses.length} expenses •{"  "} ₹
                                {submission.totalAmount?.toLocaleString()} •
                                {"  "}
                                {submission.isResubmitted
                                  ? `Resubmitted: ${new Date(
                                      submission.resubmittedAt ||
                                        submission.submittedAt
                                    ).toLocaleDateString()}`
                                  : `Submitted: ${new Date(
                                      submission.submittedAt
                                    ).toLocaleDateString()}`}
                                {"  "}
                                {submission.resubmissionCount > 0 && (
                                  <span
                                    style={{
                                      color: "#0969da",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {" "}
                                    • {submission.resubmissionCount}{" "}
                                    resubmission
                                    {submission.resubmissionCount > 1
                                      ? "s"
                                      : ""}
                                  </span>
                                )}
                              </Typography>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1, mr: 2 }}>
                              {statusCounts.approved && (
                                <Chip
                                  label={`${statusCounts.approved} Approved`}
                                  color="success"
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                              {statusCounts.pending && (
                                <Chip
                                  label={`${statusCounts.pending} Pending`}
                                  color="warning"
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                              {statusCounts.rejected && (
                                <Chip
                                  label={`${statusCounts.rejected} Rejected`}
                                  color="error"
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>

                            <IconButton>
                              {isExpanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </Box>
                        </CardContent>

                        {/* Expanded Details - Individual Expenses Table */}
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
                                        <Tooltip title={expense.description}>
                                          <Typography
                                            variant="body2"
                                            noWrap
                                            sx={{ maxWidth: 100 }}
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
                                      <TableCell noWrap sx={{ minWidth: 150 }}>
                                        <Box>
                                          <Chip
                                            label={expense.status.toUpperCase()}
                                            color={getStatusColor(
                                              expense.status
                                            )}
                                            size="small"
                                          />
                                          {/* Edit Status Indicators */}
                                          {(expense.isResubmitted ||
                                            expense.isEdited) && (
                                            <Box sx={{ mt: 1 }}>
                                              {expense.isResubmitted && (
                                                <Chip
                                                  label="Resubmitted"
                                                  size="small"
                                                  color="secondary"
                                                  variant="outlined"
                                                  sx={{ mr: 0.5 }}
                                                />
                                              )}
                                              {expense.isEdited && (
                                                <Chip
                                                  label="Edited"
                                                  size="small"
                                                  color="warning"
                                                  variant="outlined"
                                                />
                                              )}
                                            </Box>
                                          )}
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
                                                  viewDocument(expense._id);
                                                }}
                                                sx={{ color: "info.main" }}
                                              >
                                                <Visibility fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                          )}

                                          {expense.status === "pending" && (
                                            <>
                                              <Tooltip title="Approve">
                                                <IconButton
                                                  size="small"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActionDialog({
                                                      open: true,
                                                      expense,
                                                      action: "approved",
                                                    });
                                                  }}
                                                  sx={{ color: "success.main" }}
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
                                                      action: "rejected",
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

                            {/* Resubmission and Edit History Information */}
                            {(submission.isResubmitted ||
                              submission.expenses.some(
                                (exp) =>
                                  exp.editHistory && exp.editHistory.length > 0
                              )) && (
                              <Box
                                sx={{
                                  mt: 2,
                                  p: 1.5,
                                  borderRadius: "8px",
                                  border: "1px solid",
                                  borderColor: "primary.main",
                                  bgcolor: "rgb(219, 234, 255)",
                                }}
                              >
                                {submission.isResubmitted && (
                                  <Box>
                                    <Typography
                                      variant="subtitle2"
                                      color="info.dark"
                                      fontWeight={600}
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                      }}
                                    >
                                      <Edit fontSize="small" />
                                      Resubmitted Submission
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="info.dark"
                                      sx={{ pl: 2 }}
                                    >
                                      Originally submitted:{" "}
                                      {new Date(
                                        submission.originalSubmittedAt ||
                                          submission.submittedAt
                                      ).toLocaleDateString()}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="info.dark"
                                      sx={{ pl: 2 }}
                                    >
                                      Last resubmitted:{" "}
                                      {new Date(
                                        submission.resubmittedAt ||
                                          submission.submittedAt
                                      ).toLocaleDateString()}
                                    </Typography>
                                    {submission.resubmissionCount > 0 && (
                                      <Typography
                                        variant="body2"
                                        color="info.dark"
                                        fontWeight={600}
                                        sx={{ pt: 2, pl: 2 }}
                                      >
                                        Total resubmissions:{" "}
                                        {submission.resubmissionCount}
                                      </Typography>
                                    )}
                                  </Box>
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
            setActionDialog({ open: false, expense: null, action: "" });
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
                  <ThumbUp />
                ) : (
                  <ThumbDown />
                )}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {actionDialog.action === "approved" ? "Approve" : "Reject"}{" "}
                  Expense
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review and confirm your decision
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Paper
                elevation={0}
                sx={{ p: 2, bgcolor: "grey.50", borderRadius: "8px" }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Employee Details
                </Typography>
                <Typography variant="body2">
                  <strong>{actionDialog.expense?.employeeName}</strong> (
                  {actionDialog.expense?.employeeCode})
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{ p: 2, bgcolor: "grey.50", borderRadius: "8px" }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Expense Details
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Type:</strong> {actionDialog.expense?.expenseType}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Amount:</strong> ₹{actionDialog.expense?.amount}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Description:</strong>{" "}
                  {actionDialog.expense?.description}
                </Typography>
                <Typography variant="body2">
                  <strong>Travel Period:</strong>{" "}
                  {actionDialog.expense?.travelStartDate
                    ? new Date(
                        actionDialog.expense.travelStartDate
                      ).toLocaleDateString()
                    : "Not available"}{" "}
                  -{" "}
                  {actionDialog.expense?.travelEndDate
                    ? new Date(
                        actionDialog.expense.travelEndDate
                      ).toLocaleDateString()
                    : "Not available"}
                </Typography>
              </Paper>

              {actionDialog.expense?.editHistory &&
                actionDialog.expense.editHistory.length > 0 && (
                  <Paper
                    elevation={0}
                    sx={{ p: 2, bgcolor: "info.light", borderRadius: "8px" }}
                  >
                    <Typography
                      variant="subtitle2"
                      gutterBottom
                      color="info.dark"
                    >
                      Edit History ({actionDialog.expense.editHistory.length}{" "}
                      edit
                      {actionDialog.expense.editHistory.length > 1 ? "s" : ""})
                    </Typography>
                    <Typography variant="body2" color="info.dark">
                      Last edited:{" "}
                      {new Date(
                        actionDialog.expense.editHistory[
                          actionDialog.expense.editHistory.length - 1
                        ].editDate
                      ).toLocaleString()}
                    </Typography>
                    {actionDialog.expense.isResubmitted && (
                      <Typography variant="body2" color="info.dark">
                        Status: Resubmitted after rejection
                      </Typography>
                    )}
                  </Paper>
                )}

              <TextField
                label={
                  actionDialog.action === "approved"
                    ? "Approval Comments (Optional)"
                    : "Rejection Reason"
                }
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                fullWidth
                multiline
                rows={3}
                required={actionDialog.action === "rejected"}
                placeholder={
                  actionDialog.action === "approved"
                    ? "Add any approval notes..."
                    : "Please provide a reason for rejection..."
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
                setActionDialog({ open: false, expense: null, action: "" });
                setComments("");
              }}
              variant="outlined"
              sx={{ borderRadius: "8px" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
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
                ? "Approve Expense"
                : "Reject Expense"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}