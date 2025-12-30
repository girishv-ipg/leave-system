// components/FileUploadCell.jsx

import { Box, Chip, Tooltip, Typography } from "@mui/material";

import { CloudUpload } from "@mui/icons-material";

/**
 * File Upload Cell Component for Expense Table
 * Handles file upload with visual feedback for file size and status
 */
export default function FileUploadCell({ expense, onFileChange }) {
  
  const fileSize = expense.file?.size / 1024 / 1000; // Convert to MB
  const hasExistingFile = expense.existingFile && !expense.file;
  const hasNewFile = !!expense.file;

  // Determine border and background colors based on file state
  const getBorderColor = () => {
    if (hasNewFile) {
      return fileSize <= 1 ? "success.main" : "error.main";
    }
    if (hasExistingFile) return "info.main";
    return "grey.300";
  };

  const getBackgroundColor = () => {
    if (hasNewFile) {
      return fileSize <= 1
        ? "rgba(76, 175, 80, 0.05)"
        : "rgba(244, 67, 54, 0.05)";
    }
    if (hasExistingFile) return "rgba(25, 118, 210, 0.05)";
    return "rgba(0, 0, 0, 0.02)";
  };

  // Format file size for display
  const formatFileSize = (sizeInBytes) => {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  };

  // Truncate filename if too long
  const getTruncatedFileName = (fileName, maxLength = 15) => {
    if (fileName.length <= maxLength) return fileName;
    return `${fileName.substring(0, maxLength)}...`;
  };

  return (
    <Box sx={{ position: "relative", minWidth: 200 }}>
      <Tooltip
        title={
          hasNewFile
            ? fileSize <= 1
              ? `${expense.fileName} (${formatFileSize(expense.file.size)})`
              : "File size exceeds 1MB limit"
            : hasExistingFile
            ? `Current file: ${expense.fileName}. Click to change`
            : "Click to upload file (JPG, PNG, PDF - Max 1MB)"
        }
        arrow
      >
        <Box
          sx={{
            border: "1px dashed",
            borderColor: getBorderColor(),
            borderRadius: 1,
            p: 1,
            textAlign: "center",
            backgroundColor: getBackgroundColor(),
            minHeight: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            cursor: "pointer",
            "&:hover": {
              borderColor: "primary.main",
              backgroundColor: "rgba(25, 118, 210, 0.05)",
            },
          }}
        >
          {/* Hidden File Input */}
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => onFileChange(expense.id, e.target.files[0])}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: "pointer",
              top: 0,
              left: 0,
            }}
            // Remove default browser tooltip
            title=""
            aria-label="Upload file"
          />

          {/* New File Uploaded */}
          {hasNewFile ? (
            <Chip
              label={
                fileSize <= 1
                  ? getTruncatedFileName(expense.fileName)
                  : "File > 1MB"
              }
              color={fileSize <= 1 ? "success" : "error"}
              size="small"
              variant="outlined"
              sx={{ pointerEvents: "none" }} // Prevent chip from intercepting clicks
            />
          ) : hasExistingFile ? (
            /* Existing File */
            <Chip
              label={getTruncatedFileName(expense.fileName)}
              color="info"
              size="small"
              variant="outlined"
              sx={{ pointerEvents: "none" }} // Prevent chip from intercepting clicks
            />
          ) : (
            /* No File - Upload Prompt */
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                pointerEvents: "none", // Prevent box from intercepting clicks
              }}
            >
              <CloudUpload sx={{ fontSize: 16, color: "grey.500" }} />
              <Typography variant="caption" color="text.secondary">
                Upload
              </Typography>
            </Box>
          )}
        </Box>
      </Tooltip>
    </Box>
  );
}
