"use client";

import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import AdminLayout from "..";
import axiosInstance from "@/utils/helpers";
import { useRouter } from "next/router";
import withAdminAuth from "@/pages/auth/Authentication";

const Reports = () => {
  const router = useRouter();

  const [employees, setEmployees] = useState([]); // employee list
  const [form, setForm] = useState({
    employeeId: "all",
    year: new Date().getFullYear(),
    month: "all",
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axiosInstance.get("/admin/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setEmployees(response.data.data || []);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to load employees",
        severity: "error",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenerateReport = async () => {
    try {
      const response = await axiosInstance.post(
        "/admin/reports/leaves",
        {
          employeeId: form.employeeId,
          year: form.year,
          month: form.month === "all" ? undefined : form.month,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          responseType: "blob", // required for Excel download
        }
      );

      // ✅ Convert response to a blob
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // ✅ Dynamic file naming logic
      const selectedEmployee =
        form.employeeId === "all"
          ? "All_Employees"
          : (() => {
              const emp = employees.find((e) => e._id === form.employeeId);
              return emp ? emp.name.replace(/\s+/g, "_") : "Employee";
            })();

      const monthName =
        !form.month || form.month === "" || form.month === "all"
          ? "All_Months"
          : new Date(form.year, form.month - 1).toLocaleString("default", {
              month: "long",
            });

      link.setAttribute(
        "download",
        `Leave_Report_${selectedEmployee}_${monthName ? monthName + "_" : ""}${
          form.year
        }.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnackbar({
        open: true,
        message: "Report downloaded successfully!",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Failed to download report",
        severity: "error",
      });
    }
  };

  // Year options (till 2030)
  const years = Array.from(
    { length: 2030 - new Date().getFullYear() + 1 },
    (_, i) => new Date().getFullYear() + i
  );

  // Month options
  const months = [
    { name: "All Months", value: "all" },
    { name: "January", value: 1 },
    { name: "February", value: 2 },
    { name: "March", value: 3 },
    { name: "April", value: 4 },
    { name: "May", value: 5 },
    { name: "June", value: 6 },
    { name: "July", value: 7 },
    { name: "August", value: 8 },
    { name: "September", value: 9 },
    { name: "October", value: 10 },
    { name: "November", value: 11 },
    { name: "December", value: 12 },
  ];

  return (
    <AdminLayout>
      <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Reports
          </Typography>

          <Stack spacing={3} mt={2}>
            {/* 👤 Employee Dropdown */}
            <FormControl fullWidth>
              <InputLabel>Employee</InputLabel>
              <Select
                name="employeeId"
                label="Employee"
                value={form.employeeId}
                onChange={handleChange}
              >
                <MenuItem value="all">All Employees</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeCode})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 📅 Year */}
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                name="year"
                label="Year"
                value={form.year}
                onChange={handleChange}
              >
                {years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 🗓 Month (optional) */}
            {/* 🗓 Month (optional) */}
            <FormControl fullWidth variant="outlined">
              <InputLabel id="month-label">Month (optional)</InputLabel>
              <Select
                labelId="month-label"
                id="month-select"
                name="month"
                label="Month (optional)"
                value={form.month}
                onChange={handleChange}
              >
                {months.map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateReport}
            >
              Generate Report
            </Button>
          </Stack>
        </Paper>
      </Box>

      {/* Snackbar */}
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

export default withAdminAuth(Reports, ["admin", "manager", "hr", "md"]);
