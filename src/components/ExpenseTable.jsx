// components/ExpenseTable.jsx

import {
  AccountBalance,
  Download,
  Edit,
  SupervisorAccount,
  ThumbDown,
  ThumbUp,
  Visibility,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  Fade,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

/**
 * Expense Table Component
 * Displays expenses in a table format with actions
 */
export default function ExpenseTable({
  expenses,
  onView,
  onDownload,
  onEdit,
  onApprove,
  onReject,
  canEdit,
  canApprove,
  showManagerChip = true,
  showFinanceChip = true,
}) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        border: "1px solid #e1e4e8",
        borderRadius: "8px",
      }}
    >
      <Table size="medium">
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.50" }}>
            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Purpose</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Attendees</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {expenses.map((expense, index) => (
            <Fade in timeout={200 + index * 50} key={expense._id}>
              <TableRow hover>
                <TableCell>
                  <Chip
                    label={expense.expenseType}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body1"
                    sx={{
                      fontFamily: '"SF Mono", "Monaco", monospace',
                      fontWeight: 600,
                    }}
                  >
                    ₹{parseFloat(expense.amount).toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={expense.description}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                      {expense.description}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" display="block">
                    {new Date(expense.startDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" display="block">
                    to {new Date(expense.endDate).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title={expense.purpose}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                      {expense.purpose}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={expense.attendees}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                      {expense.attendees}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ minWidth: 200 }}>
                  <Box>
                    {/* Primary Status */}
                    {expense.status === "approved" && (
                      <Chip
                        label="Approved"
                        size="small"
                        sx={{
                          background:
                            "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)",
                          color: "#1a7f37",
                          border: "1px solid #1a7f3720",
                          borderRadius: "20px",
                          fontWeight: 600,
                          mb: 1,
                          fontSize: "0.7rem",
                        }}
                      />
                    )}

                    {expense.status === "pending" && (
                      <Chip
                        label="Pending"
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
                        }}
                      />
                    )}

                    {expense.status === "managerApproved" && (
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
                          mb: 1,
                          fontSize: "0.7rem",
                        }}
                      />
                    )}

                    {expense.status === "rejected" && (
                      <Chip
                        label="Rejected"
                        size="small"
                        sx={{
                          background:
                            "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)",
                          color: "#cf222e",
                          border: "1px solid #cf222e20",
                          borderRadius: "20px",
                          fontWeight: 600,
                          mb: 1,
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
                      {showManagerChip &&
                        expense.managerApproval?.status === "approved" && (
                          <Chip
                            icon={<SupervisorAccount />}
                            label="Manager ✓"
                            size="small"
                            sx={{
                              backgroundColor: "rgba(59, 130, 246, 0.1)",
                              color: "#3b82f6",
                              fontWeight: 500,
                              fontSize: "0.6875rem",
                            }}
                          />
                        )}

                      {showFinanceChip &&
                        expense.financeApproval?.status === "approved" && (
                          <Chip
                            icon={<AccountBalance />}
                            label="Finance ✓"
                            size="small"
                            sx={{
                              backgroundColor: "rgba(16, 185, 129, 0.1)",
                              color: "#10b981",
                              fontWeight: 500,
                              fontSize: "0.6875rem",
                            }}
                          />
                        )}

                      {expense.isEdited && (
                        <Chip
                          label="Edited"
                          size="small"
                          sx={{
                            backgroundColor: "rgba(245, 158, 11, 0.1)",
                            color: "#f59e0b",
                            fontWeight: 500,
                            fontSize: "0.6875rem",
                          }}
                        />
                      )}
                    </Box>

                    {/* Rejection comments */}
                    {expense.adminComments && expense.status === "rejected" && (
                      <Tooltip title={expense.adminComments}>
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{
                            mt: 0.5,
                            cursor: "pointer",
                            display: "block",
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
                    {/* View Document */}
                    {expense.files && expense.files.length > 0 && (
                      <Tooltip title="View Receipt">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(expense);
                          }}
                          sx={{ color: "info.main" }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {/* Download Receipt */}
                    {expense.files && expense.files.length > 0 && onDownload && (
                      <Tooltip title="Download Receipt">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownload(expense);
                          }}
                          sx={{ color: "#10b981" }}
                        >
                          <Download fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {/* Edit Expense */}
                    {canEdit && canEdit(expense) && onEdit && (
                      <Tooltip title="Edit Expense">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(expense);
                          }}
                          sx={{
                            color: "warning.main",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              transform: "scale(1.1) rotate(15deg)",
                              color: "warning.dark",
                            },
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {/* Approve/Reject (for Finance) */}
                    {canApprove && canApprove(expense) && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onApprove(expense);
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
                              onReject(expense);
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
            </Fade>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}