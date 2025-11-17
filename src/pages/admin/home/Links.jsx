"use client";

import { Box, Button } from "@mui/material";

import Link from "next/link";

const Links = () => {
  return (
    <Box
      sx={{
        width: "100%",
        mt: 4,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column", // vertical
          gap: 2, // spacing
          width: "250px", // optional
        }}
      >
        <Link href="/admin/requests">
          <Button variant="contained" fullWidth>
            Go to Leave Requests
          </Button>
        </Link>

        <Link href="/admin/employees">
          <Button variant="contained" fullWidth>
            Go to Employee List
          </Button>
        </Link>

        <Link href="/admin/reports">
          <Button variant="contained" fullWidth>
            Go to Reports
          </Button>
        </Link>
      </Box>
    </Box>
  );
};

export default Links;
