// pages/travel-expense/index.js
"use client";

import {
  Add,
  Assessment,
  AttachMoney,
  CalendarToday,
  Cancel,
  CheckCircle,
  Description,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import axios from "axios";
import { useRouter } from "next/navigation";

export default function EmployeeExpenses() {
  const router = useRouter();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState("");
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const statusTabs = [
    { value: "all", label: "All", icon: <Assessment /> },
    { value: "pending", label: "Pending", icon: <Schedule /> },
    { value: "approved", label: "Approved", icon: <CheckCircle /> },
    { value: "rejected", label: "Rejected", icon: <Cancel /> },
  ];

  const fetchExpenses = async (status = "all") => {
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
      setExpenses(response.data.expenses);
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
        alert("No document found for this expense");
      }
    } catch (error) {
      alert("Error viewing document: " + error.message);
    }
  };

  const handleExpenseClick = (expense) => {
    setSelectedExpense(expense);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedExpense(null);
  };

  const calculateTotals = () => {
    return expenses.reduce(
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
        backgroundColor: "white",
        py: 2,
        px: 1,
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
        <Box sx={{ flex: 1, mb: 3, textAlign: "center" }}>
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
            <Receipt />
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
            My Travel Expenses
          </Typography>
        </Box>
      </Box>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Summary Cards */}
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
                  ₹{totals.total.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Amount
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
                  ₹{totals.approved.toLocaleString()}
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
                border: "1px solid rgba(255, 152, 0, 0.1)",
              }}
            >
              <CardContent sx={{ p: 2, textAlign: "center" }}>
                <Schedule sx={{ fontSize: 24, color: "warning.main", mb: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  ₹{totals.pending.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pending
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
                  ₹{totals.rejected.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Rejected
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => router.push("/employee/travel-expense/upload")}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 600,
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 4px 15px rgba(25, 118, 210, 0.3)",
              },
              transition: "all 0.3s ease",
            }}
            startIcon={<Add />}
          >
            Submit New Expense
          </Button>
        </Box>

        {/* Tabs and Content */}
        <Card
          elevation={4}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            backgroundColor: "white",
          }}
        >
          {error && (
            <Fade in>
              <Alert
                severity="error"
                sx={{
                  m: 3,
                  mb: 0,
                  borderRadius: 2,
                  fontSize: "1rem",
                }}
              >
                {error}
              </Alert>
            </Fade>
          )}

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
              />
            ))}
          </Tabs>

          <CardContent sx={{ p: 2 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress size={40} />
              </Box>
            ) : expenses.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Receipt sx={{ fontSize: 64, color: "grey.300", mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No expenses found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start by submitting your first expense
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {expenses.map((expense) => (
                  <Grid item xs={12} key={expense._id}>
                    <Card
                      elevation={1}
                      sx={{
                        borderRadius: 2,
                        border: "1px solid rgba(0, 0, 0, 0.08)",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                          borderColor: "primary.main",
                        },
                      }}
                      onClick={() => handleExpenseClick(expense)}
                    >
                      <CardContent sx={{ p: 2 }}>
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
                              ₹
                              {parseFloat(expense.amount || 0).toLocaleString()}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: "right" }}>
                            <Chip
                              label={expense.status.toUpperCase()}
                              color={getStatusColor(expense.status)}
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            <Box>
                              {expense.fileName && (
                                <Tooltip title="View Receipt">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      viewDocument(expense._id);
                                    }}
                                    sx={{
                                      color: "primary.main",
                                      "&:hover": { bgcolor: "primary.light" },
                                    }}
                                  >
                                    <Visibility fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </Box>
                        </Box>

                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={2}>
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
                                Start:{" "}
                                {expense.travelStartDate
                                  ? new Date(
                                      expense.travelStartDate
                                    ).toLocaleDateString()
                                  : "Not available"}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "flex-start",
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
                                End:{" "}
                                {expense.travelEndDate
                                  ? new Date(
                                      expense.travelEndDate
                                    ).toLocaleDateString()
                                  : "Not available"}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box
                              sx={{ display: "flex", alignItems: "flex-start" }}
                            >
                              <Description
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

                        {expense.comments && expense.status === "rejected" && (
                          <Box
                            sx={{
                              mt: 2,
                              p: 1.5,
                              borderRadius: 1,
                              border: "1px solid",
                              borderColor: "error.main",
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="error.main"
                              fontWeight={600}
                            >
                              Rejection Reason:
                            </Typography>
                            <Typography variant="body2">
                              {expense.comments}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Expense Detail Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 },
          }}
        >
          {selectedExpense && (
            <>
              <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: `${getStatusColor(selectedExpense.status)}.main`,
                      mr: 2,
                    }}
                  >
                    {getStatusIcon(selectedExpense.status)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      Expense Details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ₹{parseFloat(selectedExpense.amount).toLocaleString()}
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
                      Travel Period
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedExpense.travelStartDate &&
                      selectedExpense.travelEndDate
                        ? `${new Date(
                            selectedExpense.travelStartDate
                          ).toLocaleDateString()} - ${new Date(
                            selectedExpense.travelEndDate
                          ).toLocaleDateString()}`
                        : "Date range not available"}
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body2">
                      {selectedExpense.description}
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2 }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Status
                    </Typography>
                    <Chip
                      label={selectedExpense.status.toUpperCase()}
                      color={getStatusColor(selectedExpense.status)}
                      size="small"
                    />
                  </Paper>

                  {selectedExpense.comments &&
                    selectedExpense.status === "rejected" && (
                      <Paper
                        elevation={0}
                        sx={{ p: 2, bgcolor: "error.light", borderRadius: 2 }}
                      >
                        <Typography
                          variant="subtitle2"
                          gutterBottom
                          color="error.main"
                        >
                          Rejection Reason
                        </Typography>
                        <Typography variant="body2">
                          {selectedExpense.comments}
                        </Typography>
                      </Paper>
                    )}
                </Stack>
              </DialogContent>
              <DialogActions sx={{ p: 3, pt: 1 }}>
                {selectedExpense.fileName && (
                  <Button
                    variant="outlined"
                    onClick={() => viewDocument(selectedExpense._id)}
                    startIcon={<Visibility />}
                  >
                    View Receipt
                  </Button>
                )}
                <Button onClick={handleCloseDialog} variant="contained">
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Box>
  );
}
