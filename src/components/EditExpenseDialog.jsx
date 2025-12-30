// components/EditExpenseDialog.jsx

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { CloudUpload, Delete, Edit } from "@mui/icons-material";
import { formatFileSize, getFileIcon } from "../utils/expenseHelpers";

import { EXPENSE_TYPES } from "../constants/expenseConstants";

export default function EditExpenseDialog({
  open,
  onClose,
  expense,
  formData,
  onFormChange,
  file,
  onFileChange,
  onFileClear,
  onSave,
  loading,
  onViewDocument,
  IconComponents,
}) {
  const isFormValid = () => {
    return (
      formData.expenseType &&
      formData.amount &&
      parseFloat(formData.amount) > 0 &&
      formData.description &&
      formData.startDate &&
      formData.endDate &&
      formData.purpose &&
      formData.attendees &&
      new Date(formData.startDate) <= new Date(formData.endDate)
    );
  };

  if (!expense) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "12px" },
      }}
    >
      <DialogTitle sx={{ borderBottom: "1px solid #e1e4e8", pb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar
            sx={{
              bgcolor: "warning.main",
              mr: 2,
              fontWeight: 600,
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
          {/* Rejection Comments */}
          {expense.adminComments && expense.status === "rejected" && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ borderRadius: "8px" }}>
                <Typography variant="subtitle2" gutterBottom>
                  Rejection Reason:
                </Typography>
                <Typography variant="body2">{expense.adminComments}</Typography>
              </Alert>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Expense Type</InputLabel>
              <Select
                value={formData.expenseType}
                label="Expense Type"
                onChange={(e) => onFormChange("expenseType", e.target.value)}
                sx={{ borderRadius: "8px" }}
              >
                {EXPENSE_TYPES.map((type) => (
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
              value={formData.amount}
              onChange={(e) => onFormChange("amount", e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => onFormChange("description", e.target.value)}
              placeholder="Enter expense description..."
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Travel Start Date"
              type="date"
              value={
                formData.startDate
                  ? new Date(formData.startDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) => onFormChange("startDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Travel End Date"
              type="date"
              value={
                formData.endDate
                  ? new Date(formData.endDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) => onFormChange("endDate", e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Purpose"
              multiline
              rows={3}
              value={formData.purpose}
              onChange={(e) => onFormChange("purpose", e.target.value)}
              placeholder="Enter expense purpose..."
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Attendees"
              multiline
              rows={3}
              value={formData.attendees}
              onChange={(e) => onFormChange("attendees", e.target.value)}
              placeholder="Enter expense attendees..."
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
          </Grid>

          {/* Current File Display */}
          {expense.files[0]?.name && !file && (
            <Grid item xs={12}>
              <Card
                sx={{
                  bgcolor: "grey.50",
                  border: "1px solid #e1e4e8",
                  borderRadius: "8px",
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      sx={{ bgcolor: "#eaebecff", color: "text.secondary" }}
                    >
                      {getFileIcon(expense.files.name, IconComponents)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Current Receipt :
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                        {expense.files[0].name}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => onViewDocument(expense)}
                      sx={{ borderRadius: "6px" }}
                    >
                      View
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* File Upload */}
          <Grid item xs={12}>
            <Card
              elevation={file ? 1 : 0}
              sx={{
                border: file
                  ? file.size <= 1048576
                    ? " #22c55e"
                    : "#dc2626"
                  : "2px dashed #cbd5e1",
                bgcolor: file
                  ? file.size <= 1048576
                    ? "#f0fdf4"
                    : "#fdf0f1ff"
                  : "#fafbfc",
                borderRadius: "12px",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {!file ? (
                  <Box sx={{ textAlign: "center" }}>
                    <CloudUpload
                      sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
                    />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {expense.files?.name
                        ? "Upload New Receipt"
                        : "Upload Receipt"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Choose a file to upload (JPEG, PNG, PDF • Max 1MB)
                    </Typography>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<CloudUpload />}
                      sx={{ borderRadius: "8px" }}
                    >
                      Choose File
                      <input
                        hidden
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        type="file"
                        onChange={onFileChange}
                      />
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: file.size > 1048576 ? "#dc2626" : "#22c55e",
                        color: "white",
                      }}
                    >
                      {getFileIcon(file.name, IconComponents)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="subtitle1"
                        color={file.size > 1048576 ? "#dc2626" : "#22c55e"}
                        fontWeight={550}
                      >
                        {file.size <= 1048576
                          ? file.name
                          : "File size exceeds 1MB"}
                      </Typography>
                      {file.size <= 1048576 && (
                        <Typography variant="body2" color="text.secondary">
                          {formatFileSize(file.size)}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      component="label"
                      variant="outlined"
                      size="small"
                      sx={{ borderRadius: "6px" }}
                    >
                      Change
                      <input
                        hidden
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        type="file"
                        onChange={onFileChange}
                      />
                    </Button>
                    <IconButton
                      onClick={onFileClear}
                      sx={{ color: "error.main" }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ borderRadius: "8px", color:"#000000ff" }}
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          color="warning"
          disabled={!isFormValid() || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Edit />}
          sx={{
            borderRadius: "8px",
            transition: "all 0.2s ease",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            },
          }}
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
