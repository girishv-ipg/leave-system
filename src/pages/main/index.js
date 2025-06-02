"use client";

import { Box, Grid, Paper, Typography } from "@mui/material";

import React from "react";
import { useRouter } from "next/navigation";

const Main = () => {
  const router = useRouter();

  const cards = [
    {
      title: "Leave Management",
      route: "/admin/requests",
    },
    {
      title: "Travel Expense Management",
      route: "/travel-expense",
    },
  ];

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        backgroundImage: 'url("/ipg2.png")',
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
        {cards.map(({ title, route }, idx) => (
          <Grid item xs={12} md={6} key={idx}>
            <Paper
              elevation={5}
              onClick={() => router.push(route)}
              sx={{
                p: 6,
                height: "100%",
                minHeight: 240,
                borderRadius: 4,
                background: "linear-gradient(to right, #ffffffcc, #e3f2fdcc)",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                cursor: "pointer",
                display: "flex", // center content
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
  );
};

export default Main;
