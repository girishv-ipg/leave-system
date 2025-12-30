// pages/employee/upload.js (REFACTORED)

import {
  Add,
  ArrowBack,
  Home,
  Logout,
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
  CircularProgress,
  Fade,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  EDIT_SUBMISSION_INSTRUCTIONS,
  NEW_SUBMISSION_INSTRUCTIONS,
  getInitialExpense,
} from "../../../constants/uploadConstants";
import React, { useEffect, useState } from "react";
import {
  calculateTotalAmount,
  fetchDraftExpenses,
  saveDraftExpenses,
  submitBulkExpenses,
  validateExpenses,
} from "../../../services/uploadService";

import BulkExpenseTable from "../../../components/BulkExpenseTable";
import UploadInstructions from "../../../components/UploadInstructions";
import { useRouter } from "next/navigation";

export default function BulkExpenseEntry() {
  const router = useRouter();

  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const [expenses, setExpenses] = useState([getInitialExpense()]);

  // Load draft expenses on mount
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const draftExpenses = await fetchDraftExpenses();
        if (draftExpenses.length > 0) {
          setExpenses(draftExpenses);
        }
      } catch (err) {
        console.error("Error loading draft:", err);
      }
    };

    loadDraft();
  }, []);

  // Add new expense row
  const addNewExpense = () => {
    setExpenses([...expenses, getInitialExpense()]);
  };

  // Delete expense row
  const deleteExpense = (id) => {
    if (expenses.length > 1) {
      setExpenses(expenses.filter((exp) => exp.id !== id));
    }
  };

  // Update expense field
  const updateExpense = (id, field, value) => {
    setExpenses(
      expenses.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  };

  // Handle file change
  const handleFileChange = (id, file) => {
    setExpenses(
      expenses.map((exp) =>
        exp.id === id
          ? { ...exp, file, fileName: file?.name || "", existingFile: false }
          : exp
      )
    );
  };

  // Submit all expenses
  const handleSubmitAll = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate expenses
    const validation = validateExpenses(expenses);
    if (!validation.valid) {
      setError(validation.error);
      setLoading(false);
      return;
    }

    try {
      const result = await submitBulkExpenses(expenses);

      if (result.message) {
        setSuccess(result.message);

        // Redirect based on user role
        const user = JSON.parse(localStorage.getItem("user"));
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save draft
  const handleSaveDraft = async () => {
    try {
      setError("");
      await saveDraftExpenses(expenses);
      setSuccess("Draft saved successfully");
      setDraftSaved(true);
      setTimeout(() => {
        setSuccess("");
        setDraftSaved(false);
      }, 3000);
    } catch (err) {
      console.error("Save draft error:", err);
      setError(err.message || "Failed to save draft");
      setTimeout(() => setError(""), 4000);
    }
  };

  // Navigation handlers
  const handleBack = () => {
    router.push("/employee/travel-expense");
  };

  const handleHome = () => {
    router.push("/main");
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
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
              <Tooltip title="Home" arrow>
                <IconButton
                  sx={{
                    transition: "all 0.2s ease",
                    color: "#1b1a1aff",
                            "&:hover": { backgroundColor: "rgba(59, 130, 246, 0.2)" },
                  }}
                  onClick={handleHome}
                >
                  <Home />
                </IconButton>
              </Tooltip>
              <Tooltip title="Logout" arrow>
                <IconButton
                  sx={{
                    color: "#000000ff",
                    transition: "all 0.2s ease",
                     "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.2)" },
                  }}
                  onClick={handleLogout}
                >
                  <Logout />
                </IconButton>
              </Tooltip>
              <Tooltip title="Back to Expenses" arrow>
                <IconButton
                  sx={{
                    color: "#000000ff",
                    transition: "all 0.2s ease",
                     "&:hover": { backgroundColor: "rgba(128, 68, 239, 0.2)" },
                     marginLeft: -0.5,
                  }}
                  onClick={handleBack}
                >
                  <ArrowBack />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ py: 1, px: 3, mt: 2 }}>
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
          <Card elevation={3} sx={{ borderRadius: 3, mb: 3, mt:2 }}>
            <CardContent sx={{ p: 0 }}>
              <BulkExpenseTable
                expenses={expenses}
                onUpdateExpense={updateExpense}
                onDeleteExpense={deleteExpense}
                onFileChange={handleFileChange}
                loading={loading}
              />

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
            {/* Total Summary */}
            <Box>
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
                  <strong>₹ {calculateTotalAmount(expenses).toFixed(2)}</strong>
                </Typography>
              </Paper>
            </Box>

            {/* Action Buttons */}
            <Box>
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

              <Button
                onClick={handleSubmitAll}
                variant="contained"
                size="large"
                disabled={loading || expenses.length === 0}
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
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
                {loading ? "Submitting..." : `Submit All (${expenses.length})`}
              </Button>
            </Box>
          </Box>

          {/* Instructions */}
          <UploadInstructions instructions={NEW_SUBMISSION_INSTRUCTIONS} />
        </Box>
      </Box>
    </>
  );
}
