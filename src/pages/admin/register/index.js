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
import { useEffect, useState } from "react";

import AdminLayout from "..";
import { Visibility } from "@mui/icons-material";
import { VisibilityOff } from "@mui/icons-material";
import axiosInstance from "@/utils/helpers";
import { useRouter } from "next/router";
import withAdminAuth from "@/pages/auth/Authentication";

// Define initial state
const initialStates = {
  name: "",
  employeeCode: "",
  role: "employee",
  password: "",
  gender: "",
  designation: "",
  department: "",
  carryOverLeaves: "",
  currentYearLeaves: "",
};

const RegisterEmployee = () => {
  const router = useRouter();
  const { edit, id } = router.query;

  const [isEditMode, setIsEditMode] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const [form, setForm] = useState(initialStates);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(initialStates);
  const [showPassword, setShowPassword] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success", // success | error | warning | info
  });

  useEffect(() => {
    // Check if we're in edit mode
    if (edit === "true" && id) {
      setIsEditMode(true);
      setEmployeeId(id);
      fetchEmployeeData(id);
    }
  }, [edit, id]);

  const fetchEmployeeData = async (employeeId) => {
    try {
      const response = await axiosInstance.get(`/admin/user/${employeeId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const employeeData = response.data.data;
      setForm(employeeData);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      setSnackbar({
        open: true,
        message: "Failed to load employee data",
        severity: "error",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setError(initialStates);

    // If employeeCode is being updated and we're not in edit mode, auto-generate the password
    if (name === "employeeCode" && !isEditMode) {
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
    if (!isEditMode && !form.password)
      newErrors.password = "Password is required";
    if (!form.designation) newErrors.designation = "Designation is required";
    if (!form.department) newErrors.department = "Department is required";

    setError(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: "Please correct the errors in the form.",
        severity: "warning",
      });
      return;
    }

    try {
      let response;

      if (isEditMode) {
        // If password is empty, remove it from the payload
        const updatePayload = { ...form };
        if (!updatePayload.password) {
          delete updatePayload.password;
        }

        response = await axiosInstance.put(
          `/update-user/${employeeId}`,
          updatePayload,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setSnackbar({
          open: true,
          message: "Employee updated successfully!",
          severity: "success",
        });
      } else {
        response = await axiosInstance.post("/users", form);
        setSnackbar({
          open: true,
          message: "Employee registered successfully!",
          severity: "success",
        });
        setForm(initialStates);
      }

      setSuccess(true);
      setError(initialStates);

      // Redirect back to employee list after successful update
      if (isEditMode) {
        setTimeout(() => {
          router.push("/admin/employees");
        }, 2000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Something went wrong.";
      setSuccess(false);

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
            {isEditMode ? "Update Employee" : "Register New Employee"}
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
              disabled={isEditMode} // Prevent changing employee code in edit mode
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
              label={
                isEditMode
                  ? "New Password (leave blank to keep current)"
                  : "Password"
              }
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
              label="Carry Over Leaves*"
              name="carryOverLeaves"
              type="number"
              value={form.carryOverLeaves}
              error={!!error.carryOverLeaves}
              helperText={error.carryOverLeaves}
              onChange={handleChange}
              fullWidth
            />

            <TextField
              label="Current Year Leaves*"
              name="currentYearLeaves"
              type="number"
              value={form.currentYearLeaves}
              error={!!error.currentYearLeaves}
              helperText={error.currentYearLeaves}
              onChange={handleChange}
              fullWidth
            />

            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={handleSubmit} fullWidth>
                {isEditMode ? "Update Employee" : "Register Employee"}
              </Button>

              {isEditMode && (
                <Button
                  variant="outlined"
                  onClick={() => router.push("/admin/employees")}
                  fullWidth
                >
                  Cancel
                </Button>
              )}
            </Stack>

            {success && (
              <Typography color="green">
                {isEditMode
                  ? "Employee updated successfully!"
                  : "Employee registered successfully!"}
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

export default withAdminAuth(RegisterEmployee, ["admin", "manager"]);
