// components/SubmissionCard.jsx

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Fade,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Cancel,
  CheckCircle,
  Edit,
  ExpandLess,
  ExpandMore,
  MoreVert,
  SupervisorAccount,
} from "@mui/icons-material";
import { getStatusCounts, getSubmissionStatus } from "../utils/expenseHelpers";

import ExpenseTable from "./ExpenseTable";

/**
 * Submission Card Component
 * Displays a collapsible expense submission card
 */
export default function SubmissionCard({
  submission,
  index,
  isExpanded,
  onToggle,
  onMenuOpen,
  currentUser,
  onViewDocument,
  onDownloadReceipt,
  onEditExpense,
  onApproveExpense,
  onRejectExpense,
  canEditExpense,
  canActOnExpense,
  canPerformBulkAction,
  onBulkApprove,
  onBulkReject,
  children, // For custom content like resubmission history
}) {
  const submissionStatus = getSubmissionStatus(submission.expenses);
  const statusCounts = getStatusCounts(submission.expenses);

  const getStatusColor = (status) => {
    const colors = {
      approved: "#1a7f37",
      rejected: "#cf222e",
      managerApproved:
        currentUser?.role === "finance" ? "#bf8700" : "#37bdfbff",
      pending: "#bf8700",
    };
    return colors[status] || "#1e293b";
  };

  return (
    <Fade in timeout={300 + index * 50}>
      <Card
        elevation={1}
        sx={{
          borderRadius: "6px",
          border: "0.1px solid #d1d5db",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <CardContent sx={{ p: 2, cursor: "pointer" }} onClick={onToggle}>
          {/* Header with Amount and Export Button */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: getStatusColor(submissionStatus),
                fontFamily: '"SF Mono", "Monaco", monospace',
              }}
            >
              ₹{submission.totalAmount?.toLocaleString()}
            </Typography>

            {onMenuOpen && (
              <Tooltip title="Export Options">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMenuOpen(e, submission);
                  }}
                  sx={{
                    color: "#64748b",
                    "&:hover": {
                      backgroundColor: "rgba(100, 116, 139, 0.1)",
                      color: "#0969da",
                    },
                  }}
                >
                  <MoreVert />
                </IconButton>
              </Tooltip>
            )}
          </Box>

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
                {/* Employee Name */}
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: "#293446ff",
                    fontSize: "1rem",
                  }}
                >
                  {submission?.employeeName}
                </Typography>

                {/* Employee Code */}
                {submission.employeeCode && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#64748b",
                      fontFamily: '"SF Mono", "Monaco", monospace',
                      backgroundColor: "#edf1f5ff",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: "10px",
                      fontSize: "0.75rem",
                    }}
                  >
                    {submission.employeeCode}
                  </Typography>
                )}

                {/* My Expense Chip */}
                {submission.employeeId === currentUser?._id && currentUser?.role === "manager" && (
                  <Chip
                    label="My Expense"
                    size="small"
                    sx={{
                      backgroundColor: "rgba(102, 126, 234, 0.1)",
                      color: "#5d76e6ff",
                      border: "1px solid rgba(102, 126, 234, 0.3)",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                    }}
                  />
                )}

                {/* Status Chips */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
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
                        fontSize: "0.7rem",
                      }}
                    />
                  )}

                  {submissionStatus === "managerApproved" && (
                    <>
                      {currentUser?.role === "finance" ? (
                        <>
                          <Chip
                            label="Pending Review"
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
                          <Chip
                            icon={<SupervisorAccount />}
                            label="Manager ✓"
                            size="small"
                            sx={{
                              backgroundColor: "rgba(59, 130, 246, 0.1)",
                              color: "#3b82f6",
                              border: "1px solid rgba(59, 130, 246, 0.2)",
                              fontWeight: 500,
                              fontSize: "0.7rem",
                            }}
                          />
                        </>
                      ) : (
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
                    </>
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

                  {submission.isResubmitted && submission.resubmissionCount > 0 && (
                    <Chip
                      label="Resubmitted"
                      size="small"
                      sx={{
                        backgroundColor: "rgba(100, 116, 139, 0.1)",
                        color: "#64748b",
                        border: "1px solid rgba(100, 116, 139, 0.2)",
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
                {submission.isResubmitted && submission.resubmissionCount > 0
                  ? `Resubmitted: ${new Date(
                      submission.updatedAt || submission.createdAt
                    ).toLocaleString()}`
                  : `Submitted: ${new Date(
                      submission.createdAt
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
            <Box sx={{ mb: 2 }}>
              <ExpenseTable
                expenses={submission.expenses}
                onView={onViewDocument}
                onDownload={onDownloadReceipt}
                onEdit={(expense) => onEditExpense(expense, submission)}
                onApprove={onApproveExpense}
                onReject={onRejectExpense}
                canEdit={(expense) => canEditExpense(expense, submission)}
                canApprove={canActOnExpense}
              />
            </Box>

            {/* Custom Children (like resubmission history) */}
            {children}

            {/* Bulk Action Buttons */}
            {canPerformBulkAction && canPerformBulkAction(submission) && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  p: 2,
                }}
              >
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CheckCircle />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBulkApprove(submission);
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
                      boxShadow: "0 4px 12px rgba(26, 127, 55, 0.3)",
                      background:
                        "linear-gradient(135deg, #bbf7d0 0%, #dcfce7 100%)",
                    },
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
                    onBulkReject(submission);
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
                      boxShadow: "0 4px 12px rgba(207, 34, 46, 0.3)",
                      background:
                        "linear-gradient(135deg, #fecaca 0%, #fee2e2 100%)",
                    },
                  }}
                >
                  REJECT ALL
                </Button>
              </Box>
            )}
          </Box>
        </Collapse>
      </Card>
    </Fade>
  );
}