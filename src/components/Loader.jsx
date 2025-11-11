import { Box, CircularProgress, Typography } from "@mui/material";

import React from "react";

const Loader = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={4}
    >
      <CircularProgress />
      <Typography variant="body1" sx={{ mt: 2 }}>
        Loading...
      </Typography>
    </Box>
  );
};

export default Loader;
