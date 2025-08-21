"use client";

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
  Grid,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import {
  AttachMoney,
  CalendarToday,
  CloudUpload,
  Description,
  Person,
  Receipt,
  Send,
} from "@mui/icons-material";
import { useEffect, useState } from "react";

import axios from "axios";
import { useRouter } from "next/navigation";

export default function SubmitExpense() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userInfo, setUserInfo] = useState({ name: "", empId: "" });

  const [formData, setFormData] = useState({
    expenseType: "travel",
    amount: "",
    description: "",
    travelStartDate: new Date().toISOString().split("T")[0],
    travelEndDate: new Date().toISOString().split("T")[0],
  });
  const [file, setFile] = useState(null);

  // Load user info from localStorage on component mount
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserInfo({
          name: user.name || "",
          empId: user.employeeCode || user.empId || "",
        });
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate dates
    if (new Date(formData.travelStartDate) > new Date(formData.travelEndDate)) {
      setError("Travel start date cannot be after end date");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login first");
        return;
      }

      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      if (file) {
        data.append("receipt", file);
      }

      const response = await axios.post(
        "http://localhost:4000/api/expenses",
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSuccess("Expense submitted successfully!");

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/employee/travel-expense");
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        py: 2,
        px: 1,
        overflow: "hidden", // Prevent any overflow
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          maxWidth: 600,
          mx: "auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Header Section */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              mx: "auto",
              mb: 1,
              bgcolor: "primary.main",
              fontSize: "1.5rem",
            }}
          >
            <Receipt />
          </Avatar>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: "text.primary",
              mb: 0.5,
            }}
          >
            Submit Travel Expense
          </Typography>
        </Box>

        {/* Main Card */}
        <Card
          elevation={4}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            backgroundColor: "white",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Alerts */}
          {error && (
            <Fade in>
              <Alert
                severity="error"
                sx={{
                  m: 2,
                  borderRadius: 2,
                  fontSize: "0.9rem",
                }}
              >
                {error}
              </Alert>
            </Fade>
          )}
          {success && (
            <Fade in>
              <Alert
                severity="success"
                sx={{
                  m: 2,
                  borderRadius: 2,
                  fontSize: "0.9rem",
                }}
              >
                {success}
              </Alert>
            </Fade>
          )}

          <CardContent sx={{ p: 2 }}>
            {/* Employee Info Section */}
            <Paper
              elevation={2}
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                background: "linear-gradient(45deg, #f8f9ff, #e8f0ff)",
                border: "1px solid rgba(103, 126, 234, 0.1)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Person sx={{ mr: 1, color: "primary.main", fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  Employee Information
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Employee Name"
                    value={userInfo.name}
                    fullWidth
                    disabled
                    variant="filled"
                    size="small"
                    sx={{
                      "& .MuiFilledInput-root": {
                        borderRadius: 1,
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <Person
                          sx={{ m: 1, color: "primary.main", fontSize: 18 }}
                        />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Employee ID"
                    value={userInfo.empId}
                    fullWidth
                    disabled
                    variant="filled"
                    size="small"
                    sx={{
                      "& .MuiFilledInput-root": {
                        borderRadius: 1,
                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <Chip
                          label="ID"
                          size="small"
                          sx={{ mr: 1, height: 16, fontSize: 10 }}
                        />
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            <form onSubmit={handleSubmit}>
              {/* Amount Section */}
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <AttachMoney
                    sx={{ mr: 1, color: "success.main", fontSize: 20 }}
                  />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Expense Amount
                  </Typography>
                </Box>
                <TextField
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleInputChange("amount")}
                  fullWidth
                  required
                  variant="outlined"
                  size="small"
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1,
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <Typography
                        variant="body1"
                        sx={{ mr: 1, color: "success.main", fontWeight: 600 }}
                      >
                        ₹
                      </Typography>
                    ),
                  }}
                />
              </Paper>

              {/* Travel Dates Section */}
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <CalendarToday
                    sx={{ mr: 1, color: "info.main", fontSize: 20 }}
                  />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Travel Period
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Travel Start Date"
                      type="date"
                      value={formData.travelStartDate}
                      onChange={handleInputChange("travelStartDate")}
                      fullWidth
                      required
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Travel End Date"
                      type="date"
                      value={formData.travelEndDate}
                      onChange={handleInputChange("travelEndDate")}
                      fullWidth
                      required
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1,
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Description Section */}
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Description
                    sx={{ mr: 1, color: "warning.main", fontSize: 20 }}
                  />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Expense Details
                  </Typography>
                </Box>
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={handleInputChange("description")}
                  fullWidth
                  required
                  multiline
                  rows={3}
                  size="small"
                  placeholder="Describe the expense (e.g., Taxi from airport to hotel, Flight tickets, Hotel accommodation, etc.)"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1,
                    },
                  }}
                />
              </Paper>

              {/* File Upload Section */}
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <CloudUpload
                    sx={{ mr: 1, color: "secondary.main", fontSize: 20 }}
                  />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Receipt Upload
                  </Typography>
                </Box>
                <Box
                  sx={{
                    position: "relative",
                    border: "2px dashed",
                    borderColor: file ? "success.main" : "grey.300",
                    borderRadius: 2,
                    p: 3,
                    textAlign: "center",
                    backgroundColor: file
                      ? "rgba(76, 175, 80, 0.05)"
                      : "rgba(0, 0, 0, 0.02)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    "&:hover": {
                      borderColor: "primary.main",
                      backgroundColor: "rgba(103, 126, 234, 0.05)",
                    },
                  }}
                >
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => setFile(e.target.files[0])}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                    }}
                  />
                  <CloudUpload
                    sx={{
                      fontSize: 32,
                      color: file ? "success.main" : "grey.400",
                      mb: 1,
                    }}
                  />
                  <Typography variant="body2" gutterBottom fontWeight={500}>
                    {file ? "Receipt Uploaded!" : "Upload Receipt"}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mb: 1 }}
                  >
                    JPG, PNG, PDF - Max 1MB
                  </Typography>
                  {file && (
                    <Chip
                      label={`${file.name} (${(file.size / 1024).toFixed(
                        1
                      )} KB)`}
                      color="success"
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>
              </Paper>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: "1rem",
                  fontWeight: 600,
                  backgroundColor: "primary.main",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 15px rgba(25, 118, 210, 0.3)",
                  },
                  "&:disabled": {
                    transform: "none",
                  },
                  transition: "all 0.3s ease",
                }}
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Send />
                  )
                }
              >
                {loading ? "Submitting..." : "Submit Expense"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
