"use client";

import { Alert, IconButton, InputAdornment, Snackbar } from "@mui/material";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AdminLayout from "..";
import { Visibility } from "@mui/icons-material";
import { VisibilityOff } from "@mui/icons-material";
import axiosInstance from "@/utils/helpers";
import { useState } from "react";
import withAdminAuth from "@/pages/auth/Authentication";

// Define initial state
const initialStates = {
  name: "",
  employeeCode: "",
  role: "employee",
  password: "",
  gender: "",
  designation: "",
  totalLeaveQuota: "",
  department: "",
};

const RegisterEmployee = () => {
  const [form, setForm] = useState(initialStates);

  const [success, setSuccess] = useState(false);

  const [error, setError] = useState(initialStates);

  const [showPassword, setShowPassword] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success", // success | error | warning | info
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setError(initialStates);

    // If employeeCode is being updated, auto-generate the password
    if (name === "employeeCode") {
      setForm((prev) => ({
        ...prev,
        employeeCode: value,
        password: `admin1234@${value}`,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = "Full name is required";
    if (!form.employeeCode)
      newErrors.employeeCode = "Employee code is required";
    if (!form.password) newErrors.password = "Password is required";
    if (!form.designation) newErrors.designation = "Designation is required";
    if (!form.department) newErrors.department = "Department is required";
    if (!form.totalLeaveQuota)
      newErrors.totalLeaveQuota = "Leave quota is required";

    setError(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: "Please correct the errors in the form.",
        severity: "warning",
      });
      return;
    }

    try {
      const response = await axiosInstance.post("/users", form);
      console.log("Registered Employee:", response.data);

      setSuccess(true);
      setError(initialStates);
      setForm(initialStates);

      setSnackbar({
        open: true,
        message: "Employee registered successfully!",
        severity: "success",
      });
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Something went wrong.";
      setSuccess(false);
      // setError(errorMsg);

      setSnackbar({
        open: true,
        message: errorMsg,
        severity: "error",
      });
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h5" gutterBottom>
            Register New Employee
          </Typography>

          <Stack spacing={2}>
            <TextField
              label="Full Name*"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={!!error.name}
              helperText={error.name}
            />
            <TextField
              label="Employee Code*"
              name="employeeCode"
              value={form.employeeCode}
              onChange={handleChange}
              error={!!error.employeeCode}
              helperText={error.employeeCode}
            />

            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                label="Gender*"
                name="gender"
                value={form.gender}
                onChange={handleChange}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth error={!form.role}>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role*"
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
              </Select>
              {!form.role && <FormHelperText>Role is required</FormHelperText>}
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Department*</InputLabel>
              <Select
                label="Department*"
                name="department"
                value={form.department}
                onChange={handleChange}
              >
                <MenuItem value="engineering">Engineering</MenuItem>
                <MenuItem value="sales">Sales</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Designation"
              name="designation"
              value={form.designation}
              onChange={handleChange}
              error={error?.designation}
              helperText={error?.designation ? "Designation is required" : ""}
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              error={!!error.password}
              helperText={error.password}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Total Leave Quota*"
              name="totalLeaveQuota"
              type="number"
              value={form.totalLeaveQuota}
              error={!!error.totalLeaveQuota}
              helperText={error.totalLeaveQuota}
              onChange={handleChange}
              fullWidth
            />

            <Button variant="contained" onClick={handleRegister}>
              Register
            </Button>

            {success && (
              <Typography color="green">
                Employee registered successfully!
              </Typography>
            )}
          </Stack>
        </Paper>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
};

export default withAdminAuth(RegisterEmployee, ["admin"]);
