export const holidays = [
  "2025-01-01",
  "2025-01-14",
  "2025-01-26",
  "2025-02-26",
  "2025-04-18",
  "2025-05-01",
  "2025-08-15",
  "2025-08-27",
  "2025-10-01",
  "2025-10-02",
  "2025-10-20",
  "2025-11-01",
  "2025-12-25",
];

/**
 * Validate file structure by checking magic numbers
 */
export const validateFileStructure = (buffer, mimeType) => {
  if (!buffer || buffer.length === 0) return false;

  try {
    // Check PDF magic number (%PDF)
    if (mimeType === "application/pdf") {
      const header = buffer.toString("utf8", 0, 4);
      return header === "%PDF";
    }

    // Check JPEG magic number (FF D8)
    if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
      return buffer[0] === 0xFF && buffer[1] === 0xD8;
    }

    // Check PNG magic number (89 50 4E 47)
    if (mimeType === "image/png") {
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4E &&
        buffer[3] === 0x47
      );
    }

    // For other file types, just check it's not empty
    return true;
  } catch (e) {
    console.error("Error validating file structure:", e);
    return false;
  }
};
