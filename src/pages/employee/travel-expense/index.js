// pages/employee/index.js

import {
  Add,
  AttachMoney,
  CalendarToday,
  Cancel,
  CheckCircle,
  CloudUpload,
  Delete,
  Description,
  Edit,
  ExpandLess,
  ExpandMore,
  Home,
  Logout,
  Person,
  Receipt,
  Schedule,
  TrendingUp,
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

  // Fetch expenses from API
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "pending":
        return "warning";
      case "manager_approved":
        return "info";
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
      case "manager_approved":
        return <Schedule />;
      default:
        return <Schedule />;
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
        if (expense.status === "manager_approved")
          acc.manager_approved += parseFloat(expense.amount) || 0;
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
    console.log("Expense => ", expense);
    setSelectedExpense(expense);
    // Fix: Properly set the expense type in edit form
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
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setNewFile(file);
  };

  const handleSaveExpense = async () => {
    try {
      setEditLoading(true);
      const token = localStorage.getItem("token");

      // Create FormData for the update
      const formData = new FormData();
      formData.append("expenseType", editFormData.expenseType);
      formData.append("amount", editFormData.amount);
      formData.append("description", editFormData.description);
      formData.append("travelStartDate", editFormData.travelStartDate);
      formData.append("travelEndDate", editFormData.travelEndDate);

      // Add new file if selected
      if (newFile) {
        formData.append("file", newFile);
      }

      const response = await axiosInstance.put(
        `/expenses/${selectedExpense._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setEditDialogOpen(false);
        setSelectedExpense(null);
        setNewFile(null);
        fetchExpenses(); // Refresh the list
        // Show success message (you can add a snackbar here)
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
      console.log("respnse of expense => ", expense);
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

  const handleNewExpense = () => {
    // Navigation to new expense page
    router.push("/employee/travel-expense/upload");
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

  // Show loading spinner
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

  // Show error state
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

  const handleHome = () => {
    router.push("/main");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

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
              <IconButton sx={{ color: "primary.light" }} onClick={handleHome}>
                <Home />
              </IconButton>
              <IconButton sx={{ color: "error.main" }} onClick={handleLogout}>
                <Logout />
              </IconButton>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleNewExpense}
                sx={{ borderRadius: "8px", fontWeight: 600 }}
              >
                New Expense
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1200, mx: "auto", px: 2, pb: 3 }}>
        {/* Enhanced Summary Cards with Gradients */}
        <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
          {[
            {
              label: "Total",
              value: totals.total,
              icon: TrendingUp,
              color: "#0969da",
              bg: "linear-gradient(135deg, #dbeafe 0%, #f0f9ff 100%)",
              border: "#0969da",
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
              label: "Manager Approved",
              value: totals.manager_approved || 0,
              icon: Schedule,
              color: "#0ea5e9",
              bg: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
              border: "#0ea5e9",
            },
            {
              label: "Pending",
              value: totals.pending,
              icon: Schedule,
              color: "#bf8700",
              bg: "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
              border: "#bf8700",
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

        {/* No data state */}
        {bulkSubmissions.length === 0 ? (
          <Card
            elevation={0}
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
                onClick={handleNewExpense}
                sx={{ borderRadius: "8px", fontWeight: 600 }}
              >
                Create First Expense
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Expense Submissions */
          <Grid container spacing={2}>
            {bulkSubmissions.map((submission) => {
              const submissionStatus = getSubmissionStatus(submission.expenses);
              const statusCounts = getStatusCounts(submission.expenses);
              const isExpanded = expandedSubmission === submission._id;

              return (
                <Grid item xs={12} key={submission._id}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: "8px",
                      border: "1px solid #e1e4e8",
                      "&:hover": { boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" },
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
                            bgcolor: `${getStatusColor(submissionStatus)}.main`,
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
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="h6" fontWeight={600}>
                              ₹{submission.totalAmount?.toLocaleString()}
                            </Typography>
                            {/* Enhanced Resubmitted Chip */}
                            {submission.isResubmitted &&
                              submission.resubmissionCount > 0 && (
                                <Chip
                                  label="Resubmitted"
                                  size="small"
                                  sx={{
                                    fontWeight: 600,
                                    background:
                                      "linear-gradient(135deg, #e6e0feff 0%, #f3f0ffff 100%)",
                                    color: "#950ee9ff",
                                    border: "1px solid #3d0ee940",
                                    borderRadius: "6px",
                                  }}
                                />
                              )}
                            {/* Enhanced Status Chips */}
                            {statusCounts.approved && (
                              <Chip
                                label={`${statusCounts.approved} Approved`}
                                size="small"
                                sx={{
                                  background:
                                    "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
                                  color: "#1a7f37",
                                  border: "1px solid #1a7f3720",
                                  borderRadius: "6px",
                                  fontWeight: 600,
                                }}
                              />
                            )}
                            {statusCounts.manager_approved && (
                              <Chip
                                label={`${statusCounts.manager_approved} Manager Approved`}
                                size="small"
                                sx={{
                                  background:
                                    "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
                                  color: "#0ea5e9",
                                  border: "1px solid #0ea5e920",
                                  borderRadius: "6px",
                                  fontWeight: 600,
                                }}
                              />
                            )}
                            {statusCounts.pending && (
                              <Chip
                                label={`${statusCounts.pending} Pending`}
                                size="small"
                                sx={{
                                  background:
                                    "linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)",
                                  color: "#bf8700",
                                  border: "1px solid #bf870020",
                                  borderRadius: "6px",
                                  fontWeight: 600,
                                }}
                              />
                            )}
                            {statusCounts.rejected && (
                              <Chip
                                label={`${statusCounts.rejected} Rejected`}
                                size="small"
                                sx={{
                                  background:
                                    "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)",
                                  color: "#cf222e",
                                  border: "1px solid #cf222e20",
                                  borderRadius: "6px",
                                  fontWeight: 600,
                                }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
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

                        <IconButton>
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>
                    </CardContent>

                    {/* Expanded Details */}
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
                                      <Chip
                                        label={expense.status.toUpperCase()}
                                        color={getStatusColor(expense.status)}
                                        size="small"
                                        sx={{
                                          fontWeight: 600,
                                          borderRadius: "6px",
                                        }}
                                      />
                                      {/* Enhanced Edit/Resubmit indicators */}
                                      {(expense.isResubmitted ||
                                        expense.isEdited) && (
                                        <Box sx={{ mt: 1 }}>
                                          {expense.isResubmitted && (
                                            <Chip
                                              label="Resubmitted"
                                              size="small"
                                              sx={{
                                                mr: 0.5,
                                                background:
                                                  "linear-gradient(135deg, #e6e0feff 0%, #f3f0ffff 100%)",
                                                color: "#950ee9ff",
                                                borderRadius: "6px",
                                                fontWeight: 600,
                                              }}
                                            />
                                          )}
                                          {expense.isEdited && (
                                            <Chip
                                              label="Edited"
                                              size="small"
                                              sx={{
                                                background:
                                                  "linear-gradient(135deg, #fed7aa 0%, #fef3c7 100%)",
                                                color: "#ea580c",
                                                borderRadius: "6px",
                                                fontWeight: 600,
                                              }}
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
                                      {/* Check for both current expense files and new file uploads */}
                                      {(expense.fileName ||
                                        (selectedExpense?._id === expense._id &&
                                          newFile)) && (
                                        <Tooltip title="View Receipt">
                                          <IconButton
                                            size="small"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleViewDocument(expense._id);
                                            }}
                                            sx={{ color: "info.main" }}
                                          >
                                            <Receipt fontSize="small" />
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

        {/* Enhanced Edit Expense Dialog */}
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
                      width: 32,
                      height: 32,
                      bgcolor: `${getStatusColor(selectedExpense.status)}.main`,
                      mr: 2,
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

              <DialogContent sx={{ pt: 3 }}>
                <Grid container spacing={3}>
                  {/* Expense Type */}
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
                        <MenuItem value="travel">Travel</MenuItem>
                        <MenuItem value="accommodation">Accommodation</MenuItem>
                        <MenuItem value="meals">Meals</MenuItem>
                        <MenuItem value="transport">Transport</MenuItem>
                        <MenuItem value="office_supplies">
                          Office Supplies
                        </MenuItem>
                        <MenuItem value="training">Training</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Amount */}
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

                  {/* Description */}
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

                  {/* Travel Dates */}
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

                  {/* Current File Info */}
                  {(selectedExpense.fileName || newFile) && (
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "grey.50",
                          borderRadius: 1,
                          border: "1px solid #e1e4e8",
                        }}
                      >
                        <Typography variant="subtitle2" gutterBottom>
                          {newFile ? "New Receipt Selected" : "Current Receipt"}
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Receipt sx={{ color: "primary.main" }} />
                          <Typography variant="body2">
                            {newFile ? newFile.name : selectedExpense.fileName}
                          </Typography>
                          {!newFile && selectedExpense.fileName && (
                            <Button
                              size="small"
                              onClick={() =>
                                handleViewDocument(selectedExpense._id)
                              }
                            >
                              View Current
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {/* File Upload */}
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 2,
                        border: "2px dashed #e1e4e8",
                        borderRadius: 1,
                      }}
                    >
                      <Stack spacing={2} alignItems="center">
                        <CloudUpload
                          sx={{ fontSize: 40, color: "text.secondary" }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          textAlign="center"
                        >
                          {selectedExpense.fileName || newFile
                            ? "Upload new receipt (optional)"
                            : "Upload receipt (optional)"}
                        </Typography>
                        <Button
                          component="label"
                          variant="outlined"
                          startIcon={<CloudUpload />}
                        >
                          Choose File
                          <input
                            hidden
                            accept="image/*,.pdf"
                            type="file"
                            onChange={handleFileChange}
                          />
                        </Button>
                        {newFile && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography variant="body2" color="success.main">
                              New file: {newFile.name}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => setNewFile(null)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  </Grid>

                  {/* Comments for rejected expenses */}
                  {selectedExpense.comments &&
                    selectedExpense.status === "rejected" && (
                      <Grid item xs={12}>
                        <Alert
                          severity="error"
                          sx={{
                            borderRadius: "8px",
                            border: "1px solid #fee2e2",
                            background:
                              "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)",
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
                  sx={{ borderRadius: "8px" }}
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
