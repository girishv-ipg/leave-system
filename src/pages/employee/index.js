"use client";

import { Alert, Snackbar } from "@mui/material";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import KeyIcon from "@mui/icons-material/Key";
import Link from "next/link";
import LogoutIcon from "@mui/icons-material/Logout";
import axiosInstance from "@/utils/helpers";
import { usePathname } from "next/navigation"; // ✅ detect current route

export default function EmployeeLayout({ children }) {
  const pathname = usePathname(); // ✅ get current route
  const [name, setName] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userInitials, setUserInitials] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.name) {
      setName(user.name);
      const nameParts = user.name.split(" ");
      const initials =
        nameParts.length >= 2
          ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
          : nameParts[0][0];
      setUserInitials(initials.toUpperCase());
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);
  const handleOpenModal = () => {
    handleCloseMenu();
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleChangePassword = async () => {
    try {
      if (!newPassword || !confirmPassword) {
        alert("All fields are required");
        return;
      }
      if (newPassword !== confirmPassword) {
        alert("New passwords don't match");
        return;
      }
      if (newPassword.length < 8) {
        alert("Password must be at least 8 characters");
        return;
      }

      const token = localStorage.getItem("token");
      await axiosInstance.put(
        "/update-password",
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSnackbarSeverity("success");
      setSnackbarMessage("Password updated successfully!");
      setSnackbarOpen(true);
      handleLogout();
    } catch (err) {
      console.error(err);
      setSnackbarSeverity("error");
      setSnackbarMessage("Failed to update password!");
      setSnackbarOpen(true);
    }
  };

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 500,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  };

  // ✅ Navigation links
  const navLinks = [
    { label: "Home", href: "/main" },
    { label: "Details", href: "/employee/employeeDetail" },
    { label: "Leave Request", href: "/employee/requestLeave" },
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
      <AppBar sx={{ height: "64px" }} position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Hi {name}, Welcome
          </Typography>

          {/* ✅ Render nav buttons with active highlight */}
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Button
                key={link.href}
                color="inherit"
                component={Link}
                href={link.href}
                sx={{
                  mx: 0.5,
                  fontWeight: isActive ? "bold" : "normal",
                  color: isActive ? "#fff" : "#e0e0e0",
                  backgroundColor: isActive
                    ? "rgba(255,255,255,0.2)"
                    : "transparent",
                  borderBottom: isActive ? "2px solid #fff" : "none",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.25)",
                  },
                }}
              >
                {link.label}
              </Button>
            );
          })}

          {/* ✅ Avatar Menu */}
          <Avatar
            sx={{
              bgcolor: "#e0e0e0",
              color: "#1976d2",
              cursor: "pointer",
              ml: 2,
            }}
            onClick={handleAvatarClick}
          >
            {userInitials}
          </Avatar>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <MenuItem onClick={handleOpenModal}>
              <KeyIcon sx={{ mr: 1, fontSize: 20 }} />
              <Typography>Change password</Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
              <Typography>Logout</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* ✅ Change Password Modal */}
      <Modal open={isModalOpen} onClose={handleCloseModal}>
        <Box sx={modalStyle}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Change password
          </Typography>

          <TextField
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={handleCloseModal} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleChangePassword}>
              Change Password
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* ✅ Page Content */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}>{children}</Box>

      {/* ✅ Snackbar for feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
