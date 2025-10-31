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
import { usePathname } from "next/navigation"; // ✅ for active route detection

export default function AdminLayout({ children }) {
  const [name, setName] = useState("Admin");
  const pathname = usePathname(); // ✅ current route path

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.name) {
      setName(user.name);
    }
  }, []);

  // ✅ Define navigation links centrally
  const navLinks = [
    { label: "Home", href: "/main" },
    { label: "Leave Requests", href: "/admin/requests" },
    { label: "Employee List", href: "/admin/employees" },
    { label: "Register Employee", href: "/admin/register" },
    { label: "Request Leave", href: "/admin/requestLeave" },
    { label: "My Leave Overview", href: "/admin/details" },
    { label: "Reports", href: "/admin/reports" },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <AppBar sx={{ height: "64px" }} position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Hi, {name}
          </Typography>

          {/* ✅ Dynamic nav rendering with active highlight */}
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Button
                key={link.href}
                component={Link}
                href={link.href}
                sx={{
                  mx: 0.5,
                  color: isActive ? "#fff" : "#e0e0e0",
                  backgroundColor: isActive
                    ? "rgba(255, 255, 255, 0.2)"
                    : "transparent",
                  fontWeight: isActive ? "bold" : "normal",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                  },
                }}
              >
                {link.label}
              </Button>
            );
          })}

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
