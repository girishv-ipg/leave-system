// app/admin/layout.tsx
"use client";

import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import Link from "next/link";
import LogoutIcon from "@mui/icons-material/Logout";

export default function EmployeeLayout({ children }) {
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const [name, setName] = useState("");

  useEffect(() => {
    // Only runs on the client
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.name) {
      setName(user.name);
    }
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <AppBar sx={{ height: "64px" }} position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Hi {name}, Welcome to Employee Portal
          </Typography>

          <Button
            color="inherit"
            component={Link}
            href="/employee/requestLeave"
          >
            Leave Request
          </Button>
          <Button color="inherit" component={Link} href="/employee/employeeDetail">
            Details
          </Button>

          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          p: 2,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
