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
  Person,
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
  const [bulkSubmissions, setBulkSubmissions] = useState([]);
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
    travelStartDate: "",
    travelEndDate: "",
  });
  const [newFile, setNewFile] = useState(null);
  const [filterType, setFilterType] = useState("year");
  const [filters, setFilters] = useState({ year: "", month: "", date: "" });

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
      value: "manager_approved",
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
    return nd.getMonth() + 1 === Number(month); // 0-based in JS
  };

  // ✅ combine status-tab filtering + date filtering
  useEffect(() => {
    // base list from tab
    let base =
      activeTab === "all"
        ? bulkSubmissions
        : bulkSubmissions
            .map((submission) => ({
              ...submission,
              expenses: submission.expenses.filter(
                (expense) => expense.status === activeTab
              ),
            }))
            .filter((submission) => submission.expenses.length > 0);

    const { year, month, date } = filters;

    // if no extra filters, done
    if (!year && !month && !date) {
      setFilteredSubmissions(base);
      return;
    }

    // apply year/month/date on each submission's expenses
    const filtered = base
      .map((submission) => {
        const exp = (submission.expenses || []).filter((e) => {
          const start = e.travelStartDate ? new Date(e.travelStartDate) : null;
          const end = e.travelEndDate ? new Date(e.travelEndDate) : null;

          // if the user applied any date filters but expense has invalid dates → drop it
          if (
            (year || month || date) &&
            (!start || !end || isNaN(start) || isNaN(end))
          ) {
            return false;
          }

          // year/month: accept if either start or end matches
          if (year) {
            const yOk = matchesYear(start, year) || matchesYear(end, year);
            if (!yOk) return false;
          }
          if (month) {
            const mOk = matchesMonth(start, month) || matchesMonth(end, month);
            if (!mOk) return false;
          }

          // specific date within [start, end] inclusive
          if (date) {
            const d = new Date(date);
            if (isNaN(d)) return false;
            if (!(d >= start && d <= end)) return false;
          }

          return true;
        });

        return { ...submission, expenses: exp };
      })
      .filter((s) => s.expenses.length > 0);

    setFilteredSubmissions(filtered);
  }, [activeTab, bulkSubmissions, filters]);

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

  // Filter submissions based on active tab
  useEffect(() => {
    if (activeTab === "all") {
      setFilteredSubmissions(bulkSubmissions);
    } else {
      const filtered = bulkSubmissions
        .map((submission) => ({
          ...submission,
          expenses: submission.expenses.filter(
            (expense) => expense.status === activeTab
          ),
        }))
        .filter((submission) => submission.expenses.length > 0);
      setFilteredSubmissions(filtered);
    }
  }, [activeTab, bulkSubmissions]);

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
      value: totals.manager_approved || 0,
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
                  background: "linear-gradient(135deg, #3367e09c 0%)",
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
                    transition: "all 0.2s ease",
                    "&:hover": {
                      color: "primary.main",
                      transform: "translateY(-1px)",
                    },
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
                    transition: "all 0.2s ease",
                    "&:hover": {
                      color: "error.main",
                      transform: "translateY(-1px)",
                    },
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
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.16)",
                  },
                  background: "linear-gradient(135deg, #3367e09c 0%)",
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
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              mr: 2,
                              fontSize: "1rem",
                              fontWeight: 600,
                            }}
                          >
                            {currentUser.name
                              ? currentUser.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                              : "E"}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 600,
                                color: "text.primary",
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
                          {/* <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              fontSize: "0.75rem",
                            }}
                          >
                            Department: {currentUser.department || "General"}
                          </Typography> */}
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
                      ml: 2,
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "rgba(0, 0, 0, 0.15) 0px 2px 4px 0px inset",
                    }}
                  >
                    {currentUser.name
                      ? currentUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
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

        {/* Enhanced Tabs */}
        {/* <Card
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
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: "1px solid #e1e4e8",
              px: 2,
              "& .MuiTab-root": {
                minHeight: 60,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.875rem",
                transition: "all 0.2s ease",
                "&:hover": {
                  transform: "translateY(-1px)",
                },
              },
              "& .Mui-selected": {
                color: "#0969da",
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#0969da",
                height: 3,
                borderRadius: "3px 3px 0 0",
              },
              "& .MuiTabs-scrollButtons": {
                display: "none", // Hide scroll arrows
              },
            }}
            variant="scrollable"
            scrollButtons={false}
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
        </Card> */}
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
                      background: "linear-gradient(135deg, #3367e09c 0%)",
                      "&:hover": {
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    Create First Expense
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
                                      transition: "all 0.2s ease",
                                      "&:hover": {
                                        transform: "scale(1.05)",
                                      },
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
                                    submission.resubmittedAt ||
                                      submission.submittedAt
                                  ).toLocaleString()}`
                                : `Submitted: ${new Date(
                                    submission.submittedAt
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
                                              "manager_approved" && (
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
                                            {expense.comments &&
                                              expense.status === "rejected" && (
                                                <Tooltip
                                                  title={expense.comments}
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
                                            {expense.fileName && (
                                              <Tooltip title="View Receipt">
                                                <IconButton
                                                  size="small"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewDocument(
                                                      expense._id
                                                    );
                                                  }}
                                                  sx={{
                                                    color: "info.main",
                                                    transition: "all 0.2s ease",
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
                      value={editFormData.travelStartDate}
                      onChange={(e) =>
                        handleFormChange("travelStartDate", e.target.value)
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
                      value={editFormData.travelEndDate}
                      onChange={(e) =>
                        handleFormChange("travelEndDate", e.target.value)
                      }
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                        },
                      }}
                    />
                  </Grid>

                  {/* Current File Display */}
                  {selectedExpense.fileName && !newFile && (
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
                          ? "2px solid #22c55e"
                          : "2px dashed #cbd5e1",
                        bgcolor: newFile ? "#f0fdf4" : "#fafbfc",
                        borderRadius: "12px",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: newFile ? "#16a34a" : "#94a3b8",
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
                                mb: 2,
                                transition: "transform 0.2s ease",
                                "&:hover": {
                                  transform: "scale(1.1)",
                                },
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

                  {/* Rejection Comments */}
                  {selectedExpense.comments &&
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
                            {selectedExpense.comments}
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
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
