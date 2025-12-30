// components/UploadInstructions.jsx

import { Box, Paper, Typography } from "@mui/material";

/**
 * Upload Instructions Component
 * Displays helpful instructions for expense submission
 */
export default function UploadInstructions({ instructions }) {
  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        mt: 4,
        borderRadius: 2,
        bgcolor: "rgba(25, 118, 210, 0.05)",
        border: "1px solid rgba(25, 118, 210, 0.1)",
      }}
    >
      <Typography variant="h6" gutterBottom color="primary" fontWeight={600}>
        Instructions:
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2 }}>
        {instructions.map((instruction, index) => (
          <Typography
            key={index}
            component="li"
            variant="body2"
            sx={{ mb: index < instructions.length - 1 ? 1 : 0 }}
          >
            {instruction}
          </Typography>
        ))}
      </Box>
    </Paper>
  );
}
