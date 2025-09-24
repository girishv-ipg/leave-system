"use client";

import { Box, Grid, IconButton, Paper, Typography } from "@mui/material";

import { Logout } from "@mui/icons-material";
import React from "react";
import { useRouter } from "next/navigation";

const Main = () => {
  const router = useRouter();

  const handleTravelExpenseClick = () => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user");
    let userRole = "employee"; // default

    if (userData) {
      try {
        const user = JSON.parse(userData);
        userRole = user.role || "employee";
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    if (
      userRole === "admin" ||
      userRole === "manager" ||
      userRole === "finance"
    ) {
      router.push("/admin/travel-expense/expense");
    } else {
      router.push("/employee/travel-expense");
    }
  };

  const handleLeaveManagementClick = () => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user");
    let userRole = "employee"; // default

    if (userData) {
      try {
        const user = JSON.parse(userData);
        userRole = user.role || "employee";
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    if (userRole === "admin" || userRole === "manager" || userRole === "hr") {
      router.push("/admin/requests");
    } else {
      router.push("/employee/requestLeave");
    }
  };

  const handleTrackAssetsClick = () => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user");

    let userRole = "employee";
    if (userData) {
      try {
        const user = JSON.parse(userData);
        userRole = user.role || "employee";
      } catch (e) {
        console.log("Error parsing user data:", e);
      }
    }
    if (
      userRole === "admin" ||
      userRole === "manager" ||
      userRole === "finance"
    ) {
      router.push("/admin/track-assets/assets");
    } else {
      router.push("/employee/track-assets/assets");
    }
  };
  const cards = [
    {
      title: "Leave Management",
      route: "/admin/requests",
      onClick: handleLeaveManagementClick,
    },
    {
      title: "Travel Expense Management",
      route: "/travel-expense",
      onClick: handleTravelExpenseClick,
    },
    {
      title: "Track Assets",
      route: "/track-assets",
      onClick: handleTrackAssetsClick,
    },
  ];
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <Box sx={{ maxHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          width: "100%",
          top: 0,
          bgcolor: "background.paper",
          zIndex: 10,
        }}
      >
        <Paper
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            p: 2,
            gap: 1,
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ pr: 2 }}>
            <img src="/ipg2.png" alt="Logo" height={40} />
          </Box>
          <IconButton
            sx={{ color: "error.main", height: 40, width: 40 }}
            onClick={handleLogout}
          >
            <Logout />
          </IconButton>
        </Paper>
      </Box>
      <Box
        sx={{
          width: "100%",
          height: "100vh",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        <Grid container spacing={4} sx={{ maxWidth: 1200 }}>
          {cards.map(({ title, onClick }, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Paper
                elevation={5}
                onClick={onClick}
                sx={{
                  p: 6,
                  height: "100%",
                  minHeight: 240,
                  borderRadius: 4,
                  background: "linear-gradient(to right, #e3f0f8cc, #e3f2fdcc)",
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.2)",
                  },
                }}
              >
                <Typography variant="h5" fontWeight={600} color="primary">
                  {title}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default Main;
