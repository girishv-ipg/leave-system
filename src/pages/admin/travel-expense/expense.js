// src/pages/admin/travel-expense/expense.js
"use client";

import {
  AccountBalance,
  AdminPanelSettings,
  Edit,
  FileDownload,
  FolderZip,
  Home,
  Logout,
  Receipt,
  SupervisorAccount,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Fade,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { Description, FilePresent } from "@mui/icons-material";
import {
  calculateTotals,
  dateInRangeOrEqual,
  matchesMonth,
  matchesYear,
  normalize,
} from "@/utils/expenseHelpers";
import {
  canActOnExpense as checkCanActOnExpense,
  canEditExpense as checkCanEditExpense,
  canPerformBulkAction as checkCanPerformBulkAction,
  createExpenseFormData,
  fetchAllExpenses,
  filterExpensesByStatus,
  financeReview,
  managerReview,
  updateExpense,
} from "@/services/expenseService";
import {
  downloadAllReceipts,
  downloadSingleReceipt,
  exportToExcel,
} from "../../../utils/excelExport";
import { useEffect, useMemo, useState } from "react";

import ActionDialog from "@/components/ActionDialog";
import EditExpenseDialog from "@/components/EditExpenseDialog";
import ExpenseFiltersMenu from "@/utils/ExpenseFiltersOthers";
import SubmissionCard from "../../../components/SubmissionCard";
import SummaryStats from "../../../components/SummaryStats";
import { getTabsByRole } from "../../../constants/expenseConstant";
import { useDocumentHandler } from "../../../hooks/useDocumentHandler";
import { useFileUpload } from "../../../hooks/useFileUpload";
import { useRouter } from "next/navigation";

export default function AdminExpenses() {
  const router = useRouter();

  // State management
  const [bulkSubmissions, setBulkSubmissions] = useState([]);
  const [allExpensesData, setAllExpensesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Action dialog state
  const [actionDialog, setActionDialog] = useState({
    open: false,
    expense: null,
    submission: null,
    action: "",
    type: "individual",
  });
  const [comments, setComments] = useState("");

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
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
    name: "",
    year: "",
    month: currentMonth,
    date: "",
  });

  // Custom hooks
  const { viewDocument, error: docError } = useDocumentHandler();
  const {
    file: newFile,
    handleFileChange,
    clearFile,
    setFile: setNewFile,
  } = useFileUpload(setError);

  // Get user info on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(user);

    // Set initial tab based on user role
    if (user?.role === "finance") {
      setActiveTab("managerApproved");
    }
  }, []);

  // Handle document errors
  useEffect(() => {
    if (docError) {
      setError(docError);
      setTimeout(() => setError(""), 4000);
    }
  }, [docError]);

  // Get status tabs based on user role
  const statusTabs = useMemo(
    () => getTabsByRole(currentUser?.role),
    [currentUser?.role]
  );

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!currentUser) return;

      try {
        const data = await fetchAllExpenses();
        setAllExpensesData(data);

        // Filter for default tab
        const defaultStatus =
          currentUser.role === "finance" ? "managerApproved" : "all";
        const filtered = filterExpensesByStatus(
          data,
          defaultStatus,
          currentUser._id
        );
        setBulkSubmissions(filtered);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchInitialData();
  }, [currentUser]);

  // Fetch expenses based on active tab
  useEffect(() => {
    if (activeTab && currentUser) {
      fetchExpenses(activeTab);
    }
  }, [activeTab, currentUser]);

  // Fetch expenses from API
  const fetchExpenses = async (status = "all") => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAllExpenses();
      const filtered = filterExpensesByStatus(data, status, currentUser?._id);
      setBulkSubmissions(filtered);

      // Update all data for stats
      if (allExpensesData.length === 0) {
        setAllExpensesData(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Navigation handlers
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

  // Menu handlers
  const handleMenuOpen = (event, submission) => {
    setAnchorEl(event.currentTarget);
    setSelectedSubmission(submission);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSubmission(null);
  };

  // Export handlers
  const handleExportExcel = async () => {
    try {
      const fileName = await exportToExcel(selectedSubmission);
      setSuccess(`Excel file downloaded: ${fileName}`);
      setTimeout(() => setSuccess(""), 3000);
      handleMenuClose();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 4000);
    }
  };

  const handleDownloadZip = async () => {
    try {
      const fileName = await downloadAllReceipts(selectedSubmission);
      setSuccess("All receipts downloaded as ZIP");
      setTimeout(() => setSuccess(""), 3000);
      handleMenuClose();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 4000);
    }
  };

  // Edit expense handlers
  const handleEditExpense = (expense, submission) => {
    setSelectedExpense(expense);
    setSelectedSubmission(submission);
    setEditFormData({
      expenseType: expense.expenseType || "",
      amount: expense.amount.toString(),
      description: expense.description,
      startDate: expense.startDate,
      endDate: expense.endDate,
      purpose: expense.purpose || "",
      attendees: expense.attendees || "",
    });
    setNewFile(null);
    setEditDialogOpen(true);
  };

  const handleFormChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

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
      setSuccess("Expense updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
      fetchExpenses(activeTab);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 4000);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedExpense(null);
    setSelectedSubmission(null);
    setNewFile(null);
    setEditFormData({
      expenseType: "",
      amount: "",
      description: "",
      startDate: "",
      endDate: "",
      purpose: "",
      attendees: "",
    });
  };

  // Action handlers (approve/reject)
  const handleIndividualAction = async () => {
    try {
      const submission =
        actionDialog.submission ||
        bulkSubmissions.find((sub) =>
          sub.expenses.some((exp) => exp._id === actionDialog.expense?._id)
        );

      if (!submission) {
        setError("Submission not found");
        return;
      }

      // Manager: Bulk review
      if (currentUser?.role === "manager") {
        await managerReview(submission._id, actionDialog.action, comments);
      }
      // Finance: Individual expense review
      else if (currentUser?.role === "finance") {
        if (!actionDialog.expense) {
          setError("No expense selected");
          return;
        }
        await financeReview(
          submission._id,
          actionDialog.expense._id,
          actionDialog.action,
          comments
        );
      }

      const actionMessage =
        actionDialog.action === "managerApproved"
          ? "Manager approved"
          : actionDialog.action;

      setActionDialog({
        open: false,
        expense: null,
        submission: null,
        action: "",
        type: "individual",
      });

      setSuccess(
        `${
          currentUser?.role === "manager" ? "Submission" : "Expense"
        } ${actionMessage} successfully!`
      );
      setComments("");

      // Refresh data
      fetchExpenses(activeTab);
      const allData = await fetchAllExpenses();
      setAllExpensesData(allData);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 4000);
    }
  };

  // Permission checks
  const canEditExpense = (expense, submission) => {
    return checkCanEditExpense(expense, submission, currentUser?._id);
  };

  const canPerformBulkAction = (submission) => {
    return checkCanPerformBulkAction(submission, currentUser?.role);
  };

  const canActOnExpense = (expense) => {
    return checkCanActOnExpense(expense, currentUser?.role);
  };

  // Toggle submission expansion
  const toggleExpanded = (submissionId) => {
    setExpandedSubmission(
      expandedSubmission === submissionId ? null : submissionId
    );
  };

  // Calculate totals
  const totals = useMemo(() => {
    let dataToCalculate = allExpensesData;

    if (activeTab === "myExpenses" && currentUser?._id) {
      dataToCalculate = allExpensesData.filter(
        (exp) => exp.employeeId === currentUser._id
      );
    }

    return calculateTotals(dataToCalculate);
  }, [allExpensesData, activeTab, currentUser]);

  // Apply filters
  const displayedSubmissions = useMemo(() => {
    const hasAnyFilter =
      normalize(filters.name) || filters.year || filters.month || filters.date;

    if (!hasAnyFilter) return bulkSubmissions;

    const nameNeedle = normalize(filters.name);
    const specificDate = filters.date || "";

    return bulkSubmissions
      .map((submission) => {
        const nameOk = nameNeedle
          ? normalize(submission.employeeName).includes(nameNeedle)
          : true;
        if (!nameOk) return null;

        const filteredExpenses = (submission.expenses || []).filter((exp) => {
          const start = exp.startDate ? new Date(exp.startDate) : null;
          const end = exp.endDate ? new Date(exp.endDate) : null;

          if (!start || isNaN(start) || !end || isNaN(end)) {
            if (filters.year || filters.month || specificDate) return false;
            return true;
          }

          const yearOk =
            matchesYear(start, filters.year) || matchesYear(end, filters.year);
          const monthOk =
            matchesMonth(start, filters.month) ||
            matchesMonth(end, filters.month);

          if (filters.year && !yearOk) return false;
          if (filters.month && !monthOk) return false;

          if (specificDate) {
            const yyyyMmDd = (d) => {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
              return `${y}-${m}-${day}`;
            };
            const s = yyyyMmDd(start);
            const e = yyyyMmDd(end);
            if (!dateInRangeOrEqual(specificDate, s, e)) return false;
          }

          return true;
        });

        if (filteredExpenses.length === 0) return null;

        return { ...submission, expenses: filteredExpenses };
      })
      .filter(Boolean);
  }, [bulkSubmissions, filters]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        position: "relative",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
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
                  borderRadius:"10px" ,
                  backgroundColor:
                    currentUser?.role === "finance" ? "#10b981" : "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: 3,
                }}
              >
                {currentUser?.role === "finance" ? (
                  <AccountBalance sx={{ color: "white", fontSize: 30, }} />
                ) : (
                  <AdminPanelSettings sx={{ color: "white", fontSize: 30 }} />
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
                  {currentUser?.role === "finance"
                    ? "Finance Executive"
                    : currentUser?.role === "manager"
                    ? "Manager"
                    : "Admin"}{" "}
                  Dashboard
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
                  Expense review and approval
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Chip
                icon={
                  currentUser?.role === "finance" ? (
                    <AccountBalance sx={{ height: 20, width: 20 }} />
                  ) : (
                    <SupervisorAccount sx={{ height: 20, width: 20 }} />
                  )
                }
                label={currentUser?.role?.toUpperCase()}
                sx={{
                  height: 28,
                  backgroundColor:
                    currentUser?.role === "finance"
                      ? "rgba(16, 185, 129, 0.1)"
                      : "rgba(59, 130, 246, 0.1)",
                  color:
                    currentUser?.role === "finance" ? "#10b981" : "#3b82f6",
                  borderRadius: "15px",
                  fontWeight: 550,
                  boxShadow: "rgba(0, 0, 0, 0.18) 0px 2px 4px 0px inset",
                }}
              />
              <Tooltip title="Home">
                <IconButton
                  onClick={handleHome}
                  sx={{
                    height: 33,
                    width: 33,
                    color: "#000000ff",
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
                    height: 33,
                    width: 33,
                    color: "#000000ff",
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
                    height: 33,
                    width: 33,
                    color: "#000000ff",
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
      <Box sx={{ maxWidth: 1400, mx: "auto", px: 2, py: 1 }}>
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

        {/* Summary Stats */}
        <SummaryStats totals={totals} userRole={currentUser?.role} />

        {/* Main Content Card */}
        <Card
          elevation={1}
          sx={{
            borderRadius: "12px",
            overflow: "hidden",
            backgroundColor: "white",
            border: "1px solid #e1e4e8",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            display: "flex",
            flexDirection: "column",
            minHeight: "400px",
            maxHeight: { xs: "55vh", sm: "65vh", md: "70vh", lg: "77vh" },
          }}
        >
          {/* Tabs + Filters */}
          <Box
            sx={{
              display: "flex",
              alignItems: "stretch",
              gap: 2,
              borderBottom: "1px solid #e1e4e8",
              px: 2,
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
                },
                "& .Mui-selected": { color: "#0969da" },
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
              }}
            >
              <ExpenseFiltersMenu
                filterType={filterType}
                setFilterType={setFilterType}
                filters={filters}
                setFilters={setFilters}
                compact
              />
            </Box>
          </Box>

          {/* Scrollable Content */}
          <CardContent
            sx={{
              p: 2,
              flex: 1,
              overflowY: "auto",
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f1f3f4",
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#c1c8cd",
                borderRadius: "3px",
                "&:hover": { backgroundColor: "#a8b1ba" },
              },
              maxHeight: "67vh"
            }}
            
          >
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress size={40} />
              </Box>
            ) : displayedSubmissions.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Receipt sx={{ fontSize: 64, color: "grey.300", mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No expense submissions found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activeTab === "all" || activeTab === "myExpenses"
                    ? "No expense submissions to display"
                    : `No ${activeTab} expense submissions to display`}
                </Typography>
              </Box>
            ) : (
              displayedSubmissions.map((submission, index) => (
                <Box key={submission._id} sx={{ mb: 2 }}>
                  <SubmissionCard
                    submission={submission}
                    index={index}
                    isExpanded={expandedSubmission === submission._id}
                    onToggle={() => toggleExpanded(submission._id)}
                    onMenuOpen={handleMenuOpen}
                    currentUser={currentUser}
                    onViewDocument={viewDocument}
                    onDownloadReceipt={async (expense) => {
                      try {
                        await downloadSingleReceipt(expense);
                        setSuccess("Receipt downloaded successfully");
                        setTimeout(() => setSuccess(""), 3000);
                      } catch (err) {
                        setError(err.message);
                        setTimeout(() => setError(""), 4000);
                      }
                    }}
                    onEditExpense={handleEditExpense}
                    onApproveExpense={(expense) =>
                      setActionDialog({
                        open: true,
                        expense,
                        submission,
                        action: "approved",
                        type: "individual",
                      })
                    }
                    onRejectExpense={(expense) =>
                      setActionDialog({
                        open: true,
                        expense,
                        submission,
                        action: "rejected",
                        type: "individual",
                      })
                    }
                    canEditExpense={canEditExpense}
                    canActOnExpense={canActOnExpense}
                    canPerformBulkAction={canPerformBulkAction}
                    onBulkApprove={(sub) =>
                      setActionDialog({
                        open: true,
                        expense: null,
                        submission: sub,
                        action: "managerApproved",
                        type: "bulk",
                      })
                    }
                    onBulkReject={(sub) =>
                      setActionDialog({
                        open: true,
                        expense: null,
                        submission: sub,
                        action: "rejected",
                        type: "bulk",
                      })
                    }
                  >
                    {/* Resubmission History */}
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
                          {new Date(submission.createdAt).toLocaleString()} •
                          Resubmitted:{" "}
                          {new Date(
                            submission.updatedAt || submission.createdAt
                          ).toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                  </SubmissionCard>
                </Box>
              ))
            )}
          </CardContent>
        </Card>

        {/* Export Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            elevation: 8,
            sx: {
              borderRadius: "8px",
              fontWeight: 600,
              minWidth: 220,
              "& .MuiMenuItem-root": {
                px: 2,
                py: 1.5,
                borderRadius: "4px",
                mx: 0.5,
                my: 0.25,
                "&:hover": {
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                },
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem onClick={handleExportExcel}>
            <ListItemIcon>
              <FileDownload sx={{ fontSize: 20, color: "#04dd37b5" }} />
            </ListItemIcon>
            <ListItemText
              primary="Export to Excel"
              primaryTypographyProps={{
                sx: {
                  fontWeight: 600,
                  color: "#373737de",
                },
              }}
            />
          </MenuItem>

          <MenuItem
            disabled={
              !selectedSubmission?.expenses?.some(
                (exp) => exp.files && exp.files.length > 0
              )
            }
            onClick={handleDownloadZip}
          >
            <ListItemIcon>
              <FolderZip sx={{ fontSize: 20, color: "#e4c605c6" }} />
            </ListItemIcon>
            <ListItemText
              primary="Download all receipts"
              primaryTypographyProps={{
                sx: {
                  fontWeight: 600,
                  color: "#373737de",
                },
              }}
            />
          </MenuItem>
        </Menu>

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

        {/* Action Dialog */}
        <ActionDialog
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
          onConfirm={handleIndividualAction}
          action={actionDialog.action}
          type={actionDialog.type}
          expense={actionDialog.expense}
          submission={actionDialog.submission}
          comments={comments}
          onCommentsChange={setComments}
          userRole={currentUser?.role}
        />
      </Box>
    </Box>
  );
}
