// pages/employee/index.js (REFACTORED)

import {
  Add,
  Home,
  Logout,
  Receipt,
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
  Grid,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { Description, FilePresent } from "@mui/icons-material";
import React, { useEffect, useMemo, useState } from "react";
import {
  calculateTotals,
  getStatusCounts,
  getSubmissionStatus,
  getUserInitials,
  matchesMonth,
  matchesYear,
} from "../../../utils/expenseHelpers";
import {
  canEditExpense as checkCanEditExpense,
  createExpenseFormData,
  fetchEmployeeExpenses,
  updateExpense,
} from "../../../services/expenseService";

import { EMPLOYEE_TABS } from "../../../constants/expenseConstants";
import EditExpenseDialog from "../../../components/EditExpenseDialog";
import ExpenseFiltersMenuForEmployee from "../../../utils/ExpenseFiltersEmployee";
import SubmissionCard from "../../../components/SubmissionCard";
import SummaryStats from "../../../components/SummaryStats";
import { useDocumentHandler } from "../../../hooks/useDocumentHandler";
import { useFileUpload } from "../../../hooks/useFileUpload";
import { useRouter } from "next/navigation";

export default function ExpenseIndex() {
  const router = useRouter();
  
  // State management
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
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

  const currentMonth = new Date().getMonth() + 1;

  // Filter state
  const [filterType, setFilterType] = useState("month");
  const [filters, setFilters] = useState({
    year: "",
    month: currentMonth,
    date: "",
  });

  // Custom hooks
  const { viewDocument, error: docError, setError: setDocError } = useDocumentHandler();
  const { file: newFile, handleFileChange, clearFile, setFile: setNewFile } = useFileUpload(setError);

  // Initialize user and fetch expenses
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(user);
    fetchExpenses();
  }, []);

  // Handle document errors
  useEffect(() => {
    if (docError) {
      setError(docError);
    }
  }, [docError]);

  // Fetch expenses from API
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEmployeeExpenses();
      setSubmissions(data);
    } catch (err) {
      console.error("Error fetching expenses:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters (tab + date filters)
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

  // Toggle submission expansion
  const toggleExpanded = (submissionId) => {
    setExpandedSubmission(
      expandedSubmission === submissionId ? null : submissionId
    );
  };

  // Handle edit expense
  const handleEditExpense = (expense, submission) => {
    setSelectedExpense(expense);
    setSelectedSubmission(submission);
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

  // Handle form field change
  const handleFormChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle save expense
  const handleSaveExpense = async () => {
    try {
      setEditLoading(true);
      
      const formData = createExpenseFormData(editFormData, newFile);
      
      await updateExpense(
        selectedSubmission._id,
        selectedExpense._id,
        formData
      );

      handleCloseEditDialog();
      fetchExpenses();
    } catch (err) {
      console.error("Error updating expense:", err);
      setError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Close edit dialog
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedExpense(null);
    setSelectedSubmission(null);
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

  // Check if user can edit expense
  const canEditExpense = (expense, submission) => {
    return checkCanEditExpense(expense, submission, currentUser?._id);
  };

  // Calculate totals
  const totals = useMemo(() => calculateTotals(submissions), [submissions]);

  // Loading state
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

  // Error state
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

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#fafbfc" }}>
      {/* Header */}
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
                    transition: "all 0.2s ease",
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
                    transition: "all 0.2s ease",
                    color: "#000000ff",
                    "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.2)" },
                  }}
                >
                  <Logout />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<Add />}
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

              {/* User Profile */}
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
                            {getUserInitials(currentUser.name)}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 600,
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
                    {getUserInitials(currentUser.name)}
                  </Avatar>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1200, mx: "auto", px: 2, pb: 3 }}>
        {/* Summary Cards */}
        <SummaryStats 
          totals={totals}
          onStatClick={(key) => setActiveTab(key === "all" ? "all" : key.toLowerCase())}
          userRole="employee"
        />

        {/* Tabs + Filters */}
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
              flexWrap: "nowrap",
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{
                flex: 1,
                minWidth: 0,
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
              {EMPLOYEE_TABS.map((tab) => (
                <Tab
                  key={tab.value}
                  label={tab.label}
                  value={tab.value}
                  icon={<tab.icon />}
                  iconPosition="start"
                />
              ))}
            </Tabs>

            <Box
              sx={{
                ml: "auto",
                display: "flex",
                alignItems: "center",
                borderLeft: "1px solid #e1e4e8",
                pl: 2,
                py: 1,
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
            {filteredSubmissions.map((submission, index) => (
              <Grid item xs={12} key={submission._id}>
                <SubmissionCard
                  submission={submission}
                  index={index}
                  isExpanded={expandedSubmission === submission._id}
                  onToggle={() => toggleExpanded(submission._id)}
                  currentUser={currentUser}
                  onViewDocument={viewDocument}
                  onEditExpense={handleEditExpense}
                  canEditExpense={canEditExpense}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Edit Dialog */}
        <EditExpenseDialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          expense={selectedExpense}
          formData={editFormData}
          onFormChange={handleFormChange}
          file={newFile}
          onFileChange={handleFileChange}
          onFileClear={clearFile}
          onSave={handleSaveExpense}
          loading={editLoading}
          onViewDocument={viewDocument}
          IconComponents={{ Description, FilePresent }}
        />
      </Box>
    </Box>
  );
}