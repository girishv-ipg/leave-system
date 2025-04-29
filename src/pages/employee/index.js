// app/admin/layout.tsx
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

export default function EmployeeLayout({ children }) {
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const [name, setName] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userInitials, setUserInitials] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  useEffect(() => {
    // Only runs on the client
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.name) {
      setName(user.name);
      const nameParts = user.name.split(" ");
      let initials = "";
      if (nameParts.length >= 2) {
        initials = nameParts[0][0] + nameParts[nameParts.length - 1][0];
      } else if (nameParts.length === 1) {
        initials = nameParts[0][0];
      }
      setUserInitials(initials.toUpperCase());
    }
  }, []);

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenModal = () => {
    handleCloseMenu();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // const handleChangePassword = async () => {
  //   // Validate passwords
  //   if (!newPassword || !confirmPassword) {
  //     alert("All fields are required");
  //     return;
  //   }

  //   if (newPassword !== confirmPassword) {
  //     alert("New passwords doesn't match");
  //     return;
  //   }

  //   // Here you would typically make an API call to change the password
  //   // For now, we'll just simulate success

  //   let password = {
  //     password: newPassword,
  //   };

  //   try {
  //     let res = await axiosInstance.put(
  //       "/update-password",
  //       {
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("token")}`,
  //         },
  //       },
  //       password
  //     );

  //     alert("Password changed successfully!");
  //     handleCloseModal();
  //   } catch {}
  // };

  const handleChangePassword = async (e) => {
    if (!newPassword || !confirmPassword) {
      alert("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New passwords doesn't match");
      return;
    }
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");

      let password = {
        password: newPassword,
      };

      const res = await axiosInstance.put(
        "/update-password",
        {
          password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSnackbarSeverity("success");
      setSnackbarMessage("Password updated successfully!");
      setSnackbarOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
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
          <Button
            color="inherit"
            component={Link}
            href="/employee/employeeDetail"
          >
            Details
          </Button>
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
            <MenuItem
              onClick={handleOpenModal}
              sx={{ display: "flex", alignItems: "center" }}
            >
              <KeyIcon sx={{ mr: 1, fontSize: 20 }} />
              <Typography>Change password</Typography>
            </MenuItem>
            <MenuItem
              onClick={handleLogout}
              sx={{ display: "flex", alignItems: "center" }}
            >
              <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
              <Typography>Logout</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="change-password-modal"
      >
        <Box sx={modalStyle}>
          <Typography
            id="modal-title"
            variant="h6"
            component="h2"
            sx={{ mb: 3 }}
          >
            Change password
          </Typography>

          <TextField
            label="New password"
            type="text"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Confirm new password"
            type="text"
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

      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          p: 2,
        }}
      >
        {children}
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => {
          setSnackbarOpen(false);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => {
            setSnackbarOpen(false);
          }}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
