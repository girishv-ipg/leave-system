"use client";

import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import axiosInstance from "@/utils/helpers";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const router = useRouter();
  const [form, setForm] = useState({ employeeCode: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (["admin", "manager"].includes(user?.role)) {
      router.replace("/admin/requests");
    } else if (user?.role === "employee") {
      router.replace("/employee/employeeDetail");
    }
  }, [router]);

  const handleChange = (e) => {
    setErrors({});
    setServerError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    setErrors({});
    setServerError("");

    const newErrors = {};
    if (!form.employeeCode)
      newErrors.employeeCode = "Employee Code is required";
    if (!form.password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await axiosInstance.post("/login", form);
      const { user, token } = response.data;

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);

      if (["admin", "manager"].includes(user?.role)) {
        router.push("/admin/requests");
      } else {
        router.push("/employee/employeeDetail");
      }
    } catch (error) {
      const msg =
        error.response?.data?.error || "Login failed. Please try again.";
      setServerError(msg);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      sx={{ backgroundColor: "#eeeeee" }}
    >
      <Paper elevation={3} sx={{ p: 4, width: 600 }}>
        <Stack spacing={2}>
          <Typography variant="h6" align="center">
            Login
          </Typography>

          {serverError && (
            <Typography variant="body2" color="error" align="center">
              {serverError}
            </Typography>
          )}

          <TextField
            label="Employee Code"
            name="employeeCode"
            value={form.employeeCode}
            onChange={handleChange}
            error={!!errors.employeeCode}
            helperText={errors.employeeCode}
            fullWidth
          />
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
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

          <Button variant="contained" onClick={handleLogin} fullWidth>
            Sign In
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default LoginPage;
