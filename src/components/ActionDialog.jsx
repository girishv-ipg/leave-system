// components/ActionDialog.jsx

import {
  AccountBalance,
  Assessment,
  SupervisorAccount,
  ThumbDown,
  ThumbUp,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

/**
 * Action Dialog Component
 * Generic dialog for approving/rejecting expenses or submissions
 */
export default function ActionDialog({
  open,
  onClose,
  onConfirm,
  action, // "approved", "rejected", "managerApproved"
  type, // "individual", "bulk"
  expense,
  submission,
  comments,
  onCommentsChange,
  userRole,
  loading = false,
}) {
  const isApproval =
    action === "approved" || action === "managerApproved";
  const roleLabel = userRole === "manager" ? "Manager" : "Finance";

  const getIcon = () => {
    if (isApproval) {
      return userRole === "manager" ? <ThumbUp /> : <AccountBalance />;
    }
    return <ThumbDown />;
  };

  const getTitle = () => {
    const actionLabel = isApproval ? "Approve" : "Reject";
    const targetLabel = type === "bulk" ? "All Expenses" : "Expense";
    return `${roleLabel} ${actionLabel} ${targetLabel}`;
  };

  const isValid = () => {
    if (action === "rejected") {
      return comments.trim().length > 0;
    }
    return true;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "12px" },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: isApproval ? "success.main" : "error.main",
              mr: 2,
            }}
          >
            {getIcon()}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {getTitle()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and confirm your decision
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          {/* Employee Details */}
          <Paper
            elevation={0}
            sx={{ p: 2, bgcolor: "grey.50", borderRadius: "8px" }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Employee Details:
            </Typography>
            <Typography variant="body2">
              <strong>{submission?.employeeName}</strong> (
              {submission?.employeeCode})
            </Typography>
          </Paper>

          {/* Individual Expense Details */}
          {type === "individual" && expense && (
            <Paper
              elevation={0}
              sx={{ p: 2, bgcolor: "grey.50", borderRadius: "8px" }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Expense Details
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Type:</strong> {expense.expenseType}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Amount:</strong> ₹{expense.amount}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Description:</strong> {expense.description}
              </Typography>
              <Typography variant="body2">
                <strong>Travel Period:</strong>{" "}
                {expense.startDate
                  ? new Date(expense.startDate).toLocaleDateString()
                  : "Not available"}{" "}
                -{" "}
                {expense.endDate
                  ? new Date(expense.endDate).toLocaleDateString()
                  : "Not available"}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Purpose:</strong> {expense.purpose}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Attendees:</strong> {expense.attendees}
              </Typography>
            </Paper>
          )}

          {/* Bulk Action Details */}
          {type === "bulk" && submission && (
            <Paper
              elevation={0}
              sx={{ p: 2, bgcolor: "grey.50", borderRadius: "8px" }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Bulk Action Details
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Total Expenses:</strong> {submission.expenses.length}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Total Amount:</strong> ₹
                {submission.totalAmount?.toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <strong>Action:</strong> {isApproval ? "Approve" : "Reject"} all
                expenses in this submission
              </Typography>
            </Paper>
          )}

          {/* Approval History */}
          {submission?.isManagerApproved && (
            <Paper
              elevation={0}
              sx={{ p: 2, bgcolor: "info.50", borderRadius: "8px" }}
            >
              <Typography variant="subtitle2" gutterBottom color="info.dark">
                Previous Approvals:
              </Typography>
              <Typography variant="body2" color="info.dark">
                <strong>Manager:</strong> Approved
              </Typography>
            </Paper>
          )}

          {/* Comments Field */}
          <TextField
            label={
              isApproval
                ? `${roleLabel} Approval Comments (Optional)`
                : `${roleLabel} Rejection Reason (Required)`
            }
            value={comments}
            onChange={(e) => onCommentsChange(e.target.value)}
            fullWidth
            multiline
            rows={3}
            required={action === "rejected"}
            placeholder={
              isApproval
                ? "Add any approval notes (optional)..."
                : "Please provide a reason for rejection (required)..."
            }
            error={action === "rejected" && !comments.trim()}
            helperText={
              action === "rejected" && !comments.trim()
                ? "Rejection reason is required"
                : ""
            }
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
              },
            }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{ borderRadius: "8px" }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color={isApproval ? "success" : "error"}
          variant="contained"
          disabled={!isValid() || loading}
          sx={{
            borderRadius: "8px",
            "&:hover": {
              transform: "translateY(-1px)",
            },
            transition: "all 0.3s ease",
          }}
        >
          {isApproval
            ? `${roleLabel} Approve ${type === "bulk" ? "All" : "Expense"}`
            : `${roleLabel} Reject ${type === "bulk" ? "All" : "Expense"}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}