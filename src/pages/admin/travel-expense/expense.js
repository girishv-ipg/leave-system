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
  Home,
  Logout,
  PendingActions,
  Person,
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
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import axios from "axios";

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionDialog, setActionDialog] = useState({
    open: false,
    expense: null,
    action: "",
  });
  const [comments, setComments] = useState("");

  const statusTabs = [
    {
      value: "pending",
      label: "Pending",
      icon: <Schedule />,
      color: "warning",
    },
    { value: "all", label: "All", icon: <Assessment />, color: "primary" },
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

      const response = await axios.get("http://localhost:4000/api/expenses", {
        headers: { Authorization: `Bearer ${token}` },
        params: { status },
      });
      console.log("(response.data.expenses => ", response.data.expenses);
      setExpenses(response.data.expenses);
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

  const handleAction = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:4000/api/expenses/${actionDialog.expense._id}/status`,
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
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    }
  };

  const viewDocument = async (expenseId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:4000/api/expenses/${expenseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        py: 2,
        px: 1,
        overflow: "hidden",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Header Section */}
      <Box sx={{ display: "flex", mb: 2 }}>
        {/* Navigation Icon */}
        <Box>
          <Tooltip title="Home">
            <IconButton
              onClick={() => router.push("/main")}
              sx={{
                ml: 4,
                mr: -4,
                fontSize: 3,
                color: "primary.main",
                "&:hover": {
                  bgcolor: "primary.main",
                  color: "white",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              <Home />
            </IconButton>
          </Tooltip>
        </Box>
        {/* Page Header */}
        <Box sx={{ flex: 1, textAlign: "center", mb: 3 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              mx: "auto",
              mb: 1,
              bgcolor: "primary.main",
              fontSize: "1.5rem",
            }}
          >
            <AdminPanelSettings />
          </Avatar>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: "text.primary",
              mb: 0.5,
            }}
          >
            Travel Expense Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and manage employee expense submissions
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          maxWidth: 1400,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Alerts */}
        {error && (
          <Fade in>
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
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
                borderRadius: 2,
                fontSize: "0.9rem",
              }}
              onClose={() => setSuccess("")}
            >
              {success}
            </Alert>
          </Fade>
        )}

        {/* Stats Cards */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 2,
                  border: "1px solid rgba(25, 118, 210, 0.1)",
                }}
              >
                <CardContent sx={{ p: 2, textAlign: "center" }}>
                  <TrendingUp
                    sx={{ fontSize: 24, color: "primary.main", mb: 1 }}
                  />
                  <Typography variant="h6" fontWeight={600}>
                    {stats.totalCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Expenses
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 2,
                  border: "1px solid rgba(255, 152, 0, 0.1)",
                }}
              >
                <CardContent sx={{ p: 2, textAlign: "center" }}>
                  <Schedule
                    sx={{ fontSize: 24, color: "warning.main", mb: 1 }}
                  />
                  <Typography variant="h6" fontWeight={600}>
                    {stats.pendingCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pending Review
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 2,
                  border: "1px solid rgba(76, 175, 80, 0.1)",
                }}
              >
                <CardContent sx={{ p: 2, textAlign: "center" }}>
                  <CheckCircle
                    sx={{ fontSize: 24, color: "success.main", mb: 1 }}
                  />
                  <Typography variant="h6" fontWeight={600}>
                    {stats.approvedCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Approved
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 2,
                  border: "1px solid rgba(244, 67, 54, 0.1)",
                }}
              >
                <CardContent sx={{ p: 2, textAlign: "center" }}>
                  <Cancel sx={{ fontSize: 24, color: "error.main", mb: 1 }} />
                  <Typography variant="h6" fontWeight={600}>
                    {stats.rejectedCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Rejected
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Main Content Card */}
        <Card
          elevation={4}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            backgroundColor: "white",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Filter Tabs */}
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              px: 2,
              "& .MuiTab-root": {
                minHeight: 60,
                fontWeight: 600,
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
                sx={{
                  color: `${tab.color}.main`,
                }}
              />
            ))}
          </Tabs>

          <CardContent sx={{ p: 2 }}>
            {/* Loading State */}
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress size={40} />
              </Box>
            ) : expenses.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <PendingActions
                  sx={{ fontSize: 64, color: "grey.300", mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No expenses found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No {activeTab === "all" ? "" : activeTab} expenses to display
                </Typography>
              </Box>
            ) : (
              /* Expense Cards */
              <Grid container spacing={2}>
                {expenses.map((expense) => (
                  <Grid item xs={12} key={expense._id}>
                    <Card
                      elevation={1}
                      sx={{
                        borderRadius: 2,
                        border: "1px solid rgba(0, 0, 0, 0.08)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                          borderColor: "primary.main",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        {/* Header Row */}
                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 2 }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: `${getStatusColor(expense.status)}.main`,
                              mr: 2,
                            }}
                          >
                            {getStatusIcon(expense.status)}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" fontWeight={600}>
                              {expense.employeeName}
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {expense.employeeCode}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            <Chip
                              label={expense.status.toUpperCase()}
                              color={getStatusColor(expense.status)}
                              size="small"
                              sx={{ mb: 1 }}
                            />
                          </Box>
                        </Box>

                        {/* Expense Details */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} sm={4}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              <CalendarToday
                                sx={{
                                  fontSize: 16,
                                  color: "text.secondary",
                                  mr: 1,
                                }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Start Date:{" "}
                                <strong>
                                  {expense.travelEndDate
                                    ? new Date(
                                        expense.travelEndDate
                                      ).toLocaleDateString()
                                    : "Not available"}
                                </strong>
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              <CalendarToday
                                sx={{
                                  fontSize: 16,
                                  color: "text.secondary",
                                  mr: 1,
                                }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                End Date:{" "}
                                <strong>
                                  {expense.travelStartDate
                                    ? new Date(
                                        expense.travelStartDate
                                      ).toLocaleDateString()
                                    : "Not available"}
                                </strong>
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              <AttachMoney
                                sx={{
                                  fontSize: 16,
                                  color: "success.main",
                                  mr: 1,
                                }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Amount:{" "}
                                <strong>
                                  ₹{parseFloat(expense.amount).toLocaleString()}
                                </strong>
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box
                              sx={{ display: "flex", alignItems: "flex-start" }}
                            >
                              <Comment
                                sx={{
                                  fontSize: 16,
                                  color: "text.secondary",
                                  mr: 1,
                                  mt: 0.2,
                                }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {expense.description}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Comments Section */}
                        {expense.comments && expense.status === "rejected" && (
                          <Box
                            sx={{
                              mb: 2,
                              p: 1.5,
                              borderRadius: 1,
                              border: "1px solid",
                              borderColor: "error.main",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 0.5,
                              }}
                            >
                              <Comment
                                sx={{
                                  fontSize: 16,
                                  color: "error.main",
                                  mr: 1,
                                }}
                              />
                              <Typography
                                variant="caption"
                                color="error.main"
                                fontWeight={600}
                              >
                                Rejection Reason:
                              </Typography>
                            </Box>
                            <Typography variant="body2">
                              {expense.comments}
                            </Typography>
                          </Box>
                        )}

                        <Divider sx={{ my: 2 }} />

                        {/* Action Buttons */}
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
                          >
                            {expense.fileName && (
                              <Tooltip title="View Receipt">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => viewDocument(expense._id)}
                                  startIcon={<Visibility />}
                                  sx={{ borderRadius: 2 }}
                                >
                                  View Receipt
                                </Button>
                              </Tooltip>
                            )}
                          </Box>

                          {expense.status === "pending" && (
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    expense,
                                    action: "approved",
                                  })
                                }
                                startIcon={<ThumbUp />}
                                sx={{
                                  borderRadius: 2,
                                  "&:hover": {
                                    transform: "translateY(-1px)",
                                  },
                                  transition: "all 0.3s ease",
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    expense,
                                    action: "rejected",
                                  })
                                }
                                startIcon={<ThumbDown />}
                                sx={{
                                  borderRadius: 2,
                                  "&:hover": {
                                    transform: "translateY(-1px)",
                                  },
                                  transition: "all 0.3s ease",
                                }}
                              >
                                Reject
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
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
            sx: { borderRadius: 3 },
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
                sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}
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
                sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Expense Details
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Amount:</strong> ₹{actionDialog.expense?.amount}
                </Typography>
                <Typography variant="body2">
                  <strong>Travel Period:</strong>{" "}
                  {actionDialog.expense?.travelStartDate
                    ? new Date(
                        actionDialog.expense.travelStartDate
                      ).toLocaleDateString()
                    : ""}{" "}
                  -{" "}
                  {actionDialog.expense?.travelEndDate
                    ? new Date(
                        actionDialog.expense.travelEndDate
                      ).toLocaleDateString()
                    : ""}
                </Typography>
              </Paper>

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
                    borderRadius: 2,
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
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              color={actionDialog.action === "approved" ? "success" : "error"}
              variant="contained"
              disabled={actionDialog.action === "rejected" && !comments.trim()}
              sx={{
                borderRadius: 2,
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
