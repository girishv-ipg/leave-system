// pages/employee/upload.js

import {
  Add,
  ArrowBack,
  AttachMoney,
  CalendarToday,
  Category,
  CloudUpload,
  Delete,
  Description,
  Person,
  Receipt,
  Save,
  Send,
  TableChart,
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
  Fade,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
import axiosInstance, { base64ToFile } from "@/utils/helpers";

import { BusinessCenter } from "@mui/icons-material";
import { Home } from "@mui/icons-material";
import { Logout } from "@mui/icons-material";
import { PersonAdd } from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function BulkExpenseEntry() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "John Doe",
    empId: "EMP001",
  });

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);

  const router = useRouter();

  const expenseTypes = [
    { value: "travel", label: "Travel" },
    { value: "breakfast", label: "Breakfast" },
    { value: "lunch", label: "Lunch" },
    { value: "dinner", label: "Dinner" },
    { value: "accommodation", label: "Accommodation" },
    { value: "transportation", label: "Transportation" },
    { value: "fuel", label: "Fuel" },
    { value: "office_supplies", label: "Office Supplies" },
    { value: "training", label: "Training & Development" },
    { value: "other", label: "Other" },
  ];

  const [expenses, setExpenses] = useState([
    {
      id: 1,
      expenseType: "travel",
      amount: "",
      description: "",
      travelStartDate: new Date().toISOString().split("T")[0],
      travelEndDate: new Date().toISOString().split("T")[0],
      file: null,
      fileName: "",
    },
  ]);

  // load draft expenses when page opens
useEffect(() => {
  const fetchDraft = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axiosInstance.get("/expenses/draft");
      const draftExpenses = res.data?.data?.expenses || [];

      if (!draftExpenses.length) return;
      
      setExpenses(
        draftExpenses.map((exp, index) => {
          // restore first file if exists
          let restoredFile = null;
          let restoredFileName = "";

          if (exp.files?.length) {
            const file = exp.files[0];
            
            try {
              restoredFile = base64ToFile(
                file.data,
                file.name,
                file.type
              );
              restoredFileName = file.name;
            } catch (err) {
              console.error(`Failed to restore file ${index}:`, err);
            }
          }

          return {
            id: Date.now() + Math.random(),
            expenseType: exp.expenseType,
            amount: exp.amount?.toString() || "",
            description: exp.description || "",
            attendees: exp.attendees || "",
            purpose: exp.purpose || "",
            travelStartDate: exp.startDate
              ? new Date(exp.startDate).toISOString().split("T")[0]
              : "",
            travelEndDate: exp.endDate
              ? new Date(exp.endDate).toISOString().split("T")[0]
              : "",
            file: restoredFile,
            fileName: restoredFileName,
          };
        })
      );
    } catch (err) {
      console.error("Error loading draft:", err);
    }
  };

  fetchDraft();
}, []);

  // Load user info from localStorage or API on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (userData) {
      const user = JSON.parse(userData);
      setUserInfo({
        name: user.name || "John Doe",
        empId: user.employeeCode || user.empId || "EMP001",
      });
    }
  }, []);

  const addNewExpense = () => {
    const newExpense = {
      id: Date.now(),
      expenseType: "travel",
      amount: "",
      description: "",
      travelStartDate: new Date().toISOString().split("T")[0],
      travelEndDate: new Date().toISOString().split("T")[0],
      file: null,
      fileName: "",
    };
    setExpenses([...expenses, newExpense]);
  };

  const deleteExpense = (id) => {
    if (expenses.length > 1) {
      setExpenses(expenses.filter((exp) => exp.id !== id));
    }
  };

  const updateExpense = (id, field, value) => {
    setExpenses(
      expenses.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  };

  const handleFileChange = (id, file) => {
    setExpenses(
      expenses.map((exp) =>
        exp.id === id
          ? { ...exp, file, fileName: file?.name || "", existingFile: false }
          : exp
      )
    );
  };

  const calculateTotalAmount = () => {
    return expenses.reduce((total, expense) => {
      const amount = parseFloat(expense.amount) || 0;
      return total + amount;
    }, 0);
  };

  const validateExpenses = () => {
    for (let expense of expenses) {
      if (!expense.expenseType || !expense.amount || !expense.description) {
        return false;
      }
      if (new Date(expense.travelStartDate) > new Date(expense.travelEndDate)) {
        return false;
      }
    }
    return true;
  };

  const handleSubmitAll = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    if (!validateExpenses()) {
      setError("Please fill in all required fields and ensure dates are valid");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));

      if (!token) {
        setError("Authentication required. Please login again.");
        setLoading(false);
        return;
      }

      // Create FormData to handle files efficiently
      const formData = new FormData();

      // Prepare expenses data without file data
      const expensesToSubmit = expenses.map((expense, index) => {
        const expenseData = {
          expenseType: expense.expenseType,
          amount: parseFloat(expense.amount),
          description: expense.description,
          startDate: expense.travelStartDate,
          endDate: expense.travelEndDate,
          attendees: expense.attendees,
          purpose: expense.purpose,
          hasFile: !!expense.file,
          fileIndex: expense.file ? index : null,
        };

        // Add file to FormData if present
        if (expense.file) {
          formData.append("files", expense.file);
        }

        return expenseData;
      });

      // Add expenses data as JSON string to FormData
      formData.append("expenses", JSON.stringify(expensesToSubmit));

      // Debug FormData contents

      // Make API call to submit bulk expenses using FormData
      const response = await axiosInstance.post("/expenses", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        timeout: 50000, // 50 seconds timeout for bulk upload
      });

      const result = response.data;

      if (result.message) {
        setSuccess(result.message);

        // Redirect to index page after 2 seconds
        setTimeout(() => {
          if (user.role === "employee") {
            router.push("/employee/travel-expense");
          } else {
            router.push("/admin/travel-expense/expense");
          }
        }, 2000);
      } else {
        setError(result.error || "Failed to submit expenses");
      }
    } catch (error) {
      // Handle axios error responses
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          "Server error occurred";

        if (status === 413) {
          setError(
            "Request too large. Please reduce file sizes or submit fewer expenses at once."
          );
        } else if (status === 401) {
          setError("Session expired. Please login again.");
        } else {
          setError(errorMessage);
        }
      } else if (error.request) {
        setError("Network error. Please check your connection and try again.");
      } else if (error.code === "ECONNABORTED") {
        setError(
          "Request timeout. Please try again with fewer expenses or smaller files."
        );
      } else {
        setError(
          error.message || "Something went wrong while submitting expenses"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Save Draft button handler
const handleSaveDraft = async () => {
  try {
    const formData = new FormData();

    const draftExpenses = expenses.map((expense, index) => {
      const data = {
        expenseType: expense.expenseType,
        amount: expense.amount,
        description: expense.description,
        startDate: expense.travelStartDate,
        endDate: expense.travelEndDate,
        attendees: expense.attendees,
        purpose: expense.purpose,
        hasFile: !!expense.file,
        fileIndex: expense.file ? index : null,
      };

      // attach file if exists
      if (expense.file) {
        formData.append("files", expense.file);
      }

      return data;
    });

    formData.append("expenses", JSON.stringify(draftExpenses));

    await axiosInstance.post("/expenses/draft", formData);

    setSuccess("Draft saved successfully");
    setDraftSaved(true);
    setTimeout(() => { setSuccess(""); setDraftSaved(false); }, 3000);
  } catch (err) {
    setError("Failed to save draft");
  }
};


  const FileUploadCell = ({ expense }) => {
    const fileSize = expense.file?.size / 1024 / 1000;
    const hasExistingFile = expense.existingFile && !expense.file;
    const hasNewFile = !!expense.file;

    return (
      <Box sx={{ position: "relative", minWidth: 200 }}>
        <Box
          sx={{
            border: "1px dashed",
            borderColor: hasNewFile
              ? fileSize <= 1
                ? "success.main"
                : "error.main"
              : hasExistingFile
              ? "info.main"
              : "grey.300",
            borderRadius: 1,
            p: 1,
            textAlign: "center",
            backgroundColor: hasNewFile
              ? fileSize <= 1
                ? "rgba(76, 175, 80, 0.05)"
                : "rgba(244, 67, 54, 0.05)"
              : hasExistingFile
              ? "rgba(25, 118, 210, 0.05)"
              : "rgba(0, 0, 0, 0.02)",
            minHeight: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&:hover": {
              borderColor: "primary.main",
              backgroundColor: "rgba(25, 118, 210, 0.05)",
            },
          }}
        >
          <input
            type="file"
            title=""
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => handleFileChange(expense.id, e.target.files[0])}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: "pointer",
            }}
          />
          {hasNewFile ? (
            <Tooltip
              title={
                fileSize <= 1
                  ? `${expense.fileName} (${(expense.file.size / 1024).toFixed(
                      1
                    )} KB)`
                  : ""
              }
            >
              <Chip
                label={
                  expense.fileName.length > 15 && fileSize <= 1
                    ? `${expense.fileName.substring(0, 15)}...`
                    : fileSize <= 1
                    ? expense.fileName
                    : "Please upload file less than 1MB"
                }
                color={fileSize <= 1 ? "success" : "error"}
                size="small"
                variant="outlined"
              />
            </Tooltip>
          ) : hasExistingFile ? (
            <Tooltip title={`Current file: ${expense.fileName}`}>
              <Chip
                label={
                  expense.fileName.length > 15
                    ? `${expense.fileName.substring(0, 15)}...`
                    : expense.fileName
                }
                color="info"
                size="small"
                variant="outlined"
              />
            </Tooltip>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <CloudUpload sx={{ fontSize: 16, color: "grey.500" }} />
              <Typography variant="caption" color="text.secondary">
                Upload
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const handleBack = () => {
    router.push("/employee/travel-expense");
  };

  const handleHome = () => {
    router.push("/main");
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axiosInstance.post(
        "/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // If backend says logout success → remove token
      if (response.status === 200) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/";
      } else {
        console.error("Logout failed:", response);
      }
    } catch (err) {
      console.error("Logout API failed:", err);
    }
  };

  return (
    <>
      {/* Header */}
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
        <Box sx={{ mx: "auto", px: 2, py: 2 }}>
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
                <TableChart />
              </Avatar>
              <Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: "text.primary" }}
                >
                  Submit Travel Expenses
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                sx={{
                  transition: "all 0.2s ease",
                  "&:hover": {
                    color: "primary.main",
                    transform: "translateY(-1px)",
                  },
                }}
                onClick={handleHome}
              >
                <Home />
              </IconButton>
              <IconButton
                sx={{
                  transition: "all 0.2s ease",
                  "&:hover": {
                    color: "error.main",
                    transform: "translateY(-1px)",
                  },
                }}
                onClick={handleLogout}
              >
                <Logout />
              </IconButton>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleBack}
                sx={{
                  borderRadius: "8px",
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  p: 1,
                  ml: 1,
                }}
              >
                Back to Expenses
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ py: 2, px: 3, mt: 2 }}>
        <Box sx={{ maxWidth: "100%", mx: "auto" }}>
          {/* Alerts */}
          {error && (
            <Fade in>
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            </Fade>
          )}
          {success && !draftSaved && (
            <Fade in>
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                {success}
                <br />
                <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
                  Redirecting to dashboard...
                </Typography>
              </Alert>
            </Fade>
          )}
          {success && draftSaved && (
            <Fade in>
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                {success}
              </Alert>
            </Fade>
          )}

          {/* Expenses Table */}
          <Card elevation={3} sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <TableContainer
                sx={{
                  minHeight: "400px",
                  maxHeight: { xs: "55vh", sm: "65vh", md: "70vh", lg: "52vh" },
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: "primary.main",
                          color: "white",
                        }}
                      >
                        Sl No.
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: isEditMode ? "warning.main" : "primary.main",
                          color: "white",
                          minWidth: 150,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Category sx={{ fontSize: 16 }} />
                          Expense Type
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: isEditMode ? "warning.main" : "primary.main",
                          color: "white",
                          minWidth: 120,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <AttachMoney sx={{ fontSize: 16 }} />
                          Amount (₹)
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: isEditMode ? "warning.main" : "primary.main",
                          color: "white",
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Description sx={{ fontSize: 16 }} />
                          Description
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: isEditMode ? "warning.main" : "primary.main",
                          color: "white",
                          minWidth: 150,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <CalendarToday sx={{ fontSize: 16 }} />
                          Start Date
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: isEditMode ? "warning.main" : "primary.main",
                          color: "white",
                          minWidth: 150,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <CalendarToday sx={{ fontSize: 16 }} />
                          End Date
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: isEditMode ? "warning.main" : "primary.main",
                          color: "white",
                          minWidth: 150,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <BusinessCenter sx={{ fontSize: 16 }} />
                          Purpose
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: isEditMode ? "warning.main" : "primary.main",
                          color: "white",
                          minWidth: 150,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <PersonAdd sx={{ fontSize: 16 }} />
                          Attendees
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          bgcolor: isEditMode ? "warning.main" : "primary.main",
                          color: "white",
                          minWidth: 200,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Receipt sx={{ fontSize: 16 }} />
                          Receipt
                        </Box>
                      </TableCell>
                      {!isEditMode && (
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            bgcolor: "primary.main",
                            color: "white",
                            width: 60,
                          }}
                        >
                          Actions
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody sx={{ minHeight: "400px", overflow: "auto" }}>
                    {expenses.map((expense, index) => (
                      <TableRow key={expense.id} hover>
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            color: isEditMode ? "warning.main" : "primary.main",
                          }}
                        >
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select
                              value={expense.expenseType}
                              onChange={(e) =>
                                updateExpense(
                                  expense.id,
                                  "expenseType",
                                  e.target.value
                                )
                              }
                              displayEmpty
                            >
                              {expenseTypes.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                  {type.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={expense?.amount}
                            onChange={(e) =>
                              updateExpense(
                                expense?.id,
                                "amount",
                                e.target.value
                              )
                            }
                            fullWidth
                            size="small"
                            placeholder="0.00"
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={expense.description}
                            onChange={(e) =>
                              updateExpense(
                                expense.id,
                                "description",
                                e.target.value
                              )
                            }
                            fullWidth
                            sx={{ minWidth: 150 }}
                            size="small"
                            placeholder="Enter description"
                            multiline
                            maxRows={2}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="date"
                            value={expense.travelStartDate}
                            onChange={(e) =>
                              updateExpense(
                                expense.id,
                                "travelStartDate",
                                e.target.value
                              )
                            }
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="date"
                            value={expense.travelEndDate}
                            onChange={(e) =>
                              updateExpense(
                                expense.id,
                                "travelEndDate",
                                e.target.value
                              )
                            }
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={expense.purpose}
                            onChange={(e) =>
                              updateExpense(
                                expense.id,
                                "purpose",
                                e.target.value
                              )
                            }
                            fullWidth
                            size="small"
                            placeholder="Enter purpose"
                            multiline
                            maxRows={2}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={expense.attendees}
                            onChange={(e) =>
                              updateExpense(
                                expense.id,
                                "attendees",
                                e.target.value
                              )
                            }
                            fullWidth
                            size="small"
                            placeholder="Enter attendees"
                            multiline
                            maxRows={2}
                          />
                        </TableCell>
                        <TableCell>
                          <FileUploadCell expense={expense} />
                        </TableCell>
                        {!isEditMode && (
                          <TableCell>
                            <Tooltip
                              title={
                                expenses.length === 1
                                  ? "Cannot delete the last expense"
                                  : "Delete expense"
                              }
                            >
                              <span>
                                <IconButton
                                  onClick={() => deleteExpense(expense.id)}
                                  disabled={expenses.length === 1}
                                  size="small"
                                  color="error"
                                >
                                  <Delete />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box
                display="flex"
                alignItems="space-between"
                gap={1}
                sx={{ pt: 2, pr: 2 }}
              >
                <Typography flex={1}>{"  "}</Typography>
                <Button
                  onClick={addNewExpense}
                  variant="outlined"
                  startIcon={<Add />}
                  disabled={loading}
                  sx={{
                    py: 1,
                    px: 1,
                    borderRadius: 2,
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    borderColor: "primary.main",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 15px rgba(25, 118, 210, 0.2)",
                    },
                  }}
                >
                  Add New Expense
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Action Buttons and Summary */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexDirection={{ xs: "column", md: "row" }}
            gap={2}
          >
            <Box>
              {/* Total Summary */}
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, #c9dffaff 0%, #e0eff9ff 100%)",
                  minWidth: 180,
                }}
              >
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                  Total Amount :{" "}
                  <strong>₹ {calculateTotalAmount().toFixed(2)}</strong>
                </Typography>
              </Paper>
            </Box>
            <Box>
              {/* Save Draft Button */}
              <Button
                variant="outlined"
                startIcon={<Save />}
                onClick={handleSaveDraft}
                disabled={loading}
                sx={{
                  mr: 2,
                  py: 1.5,
                  px: 2,
                  borderRadius: 2,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                }}
              >
                Save
              </Button>

              {/* Submit Button */}
              <Button
                onClick={isEditMode ? handleEditSubmit : handleSubmitAll}
                variant="contained"
                size="large"
                disabled={loading || expenses.length === 0}
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : isEditMode ? (
                    <Save />
                  ) : (
                    <Send />
                  )
                }
                sx={{
                  py: 1.5,
                  px: 2,
                  borderRadius: 2,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  background: "secondary",
                  "&:disabled": {
                    background: "rgba(0, 0, 0, 0.12)",
                  },
                }}
              >
                {loading ? "Submitting..." : ` Submit All (${expenses.length})`}
              </Button>
            </Box>
          </Box>

          {/* Instructions */}
          <Paper
            elevation={1}
            sx={{
              p: 3,
              mt: 4,
              borderRadius: 2,
              bgcolor: isEditMode
                ? "rgba(255, 152, 0, 0.05)"
                : "rgba(25, 118, 210, 0.05)",
              border: isEditMode
                ? "1px solid rgba(255, 152, 0, 0.1)"
                : "1px solid rgba(25, 118, 210, 0.1)",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              color={isEditMode ? "warning.main" : "primary"}
              fontWeight={600}
            >
              {isEditMode ? "Edit Instructions:" : "Instructions:"}
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              {isEditMode ? (
                <>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Update any fields that need correction
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Upload a new receipt if needed (JPG, PNG, or PDF format, max
                    1MB)
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Ensure travel end date is not before start date
                  </Typography>
                  <Typography component="li" variant="body2">
                    Click Update Expense to resubmit for approval
                  </Typography>
                </>
              ) : (
                <>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Fill in all the required fields for each expense entry
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Upload receipts in JPG, PNG, JPEG or PDF format (max 1MB
                    each)
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Ensure travel end date is not before start date
                  </Typography>
                  <Typography component="li" variant="body2">
                    Use Add New Expense to add more entries to the table
                  </Typography>
                </>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </>
  );
}
