import { Box, Typography } from "@mui/material";

import React from "react";
import ReportGmailerrorredIcon from "@mui/icons-material/ReportGmailerrorred";

const NoDataFound = ({ message }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={4}
      sx={{
        backgroundColor: "#f5f5f5",
        borderRadius: 2,
        border: "1px solid #e0e0e0",
      }}
    >
      <ReportGmailerrorredIcon sx={{ fontSize: 40, color: "#ff5252", mb: 1 }} />
      <Typography variant="h6" color="text.primary">
        {message}
      </Typography>
    </Box>
  );
};

export default NoDataFound;
