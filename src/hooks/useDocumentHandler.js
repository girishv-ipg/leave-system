// hooks/useDocumentHandler.js

import { getExtension } from "@/utils/expenseHelpers";
import { useState } from "react";
import { handleViewDocument as viewDocumentUtil } from "@/utils/HandleViewDocument";

/**
 * Hook for handling document viewing and downloading
 * Expects files stored with clean base64 (no data URI prefix)
 */
export const useDocumentHandler = () => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /**
   * View document in new tab (uses robust utility with validation)
   */
  const viewDocument = async (expense) => {
    try {
      await viewDocumentUtil(expense);
    } catch (err) {
      setError(err.message || "Error viewing document");
      setTimeout(() => setError(""), 4000);
    }
  };

  /**
   * Hook for handling document viewing and downloading
   * Works with MongoDB Binary data that comes as base64 from API
   */
  const bufferToBytes = (data) => {
    // Check if data is already a Buffer object with base64
    if (
      data &&
      typeof data === "object" &&
      data.type === "Buffer" &&
      Array.isArray(data.data)
    ) {
      // Data is in format: { type: "Buffer", data: [byte, byte, ...] }
      return new Uint8Array(data.data);
    }

    // Check if it's a base64 string (from API serialization)
    if (typeof data === "string") {
      // Remove data URI prefix if present
      let cleanData = data.trim();
      if (cleanData.startsWith("data:")) {
        const commaIndex = cleanData.indexOf(",");
        if (commaIndex !== -1) {
          cleanData = cleanData.substring(commaIndex + 1);
        }
      }

      // Remove whitespace
      cleanData = cleanData.replace(/\s+/g, "");

      try {
        // Decode base64 to binary
        const binaryString = atob(cleanData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      } catch (e) {
        console.error("Base64 decode error:", e);
        throw new Error("Invalid file data encoding");
      }
    }

    throw new Error("Unsupported file data format");
  };

  /**
   * Normalize MIME type
   */
  const normalizeMimeType = (type) => {
    if (!type) return "application/octet-stream";

    const normalized = type.toLowerCase().trim();
    if (normalized === "image/jpg") return "image/jpeg";
    if (normalized === "jpg") return "image/jpeg";
    if (normalized === "jpeg") return "image/jpeg";
    if (normalized === "png") return "image/png";
    if (normalized === "pdf") return "application/pdf";

    return normalized;
  };

  /**
   * Validate file data integrity by checking magic numbers
   */
  const validateFileData = (bytes, mimeType) => {
    if (bytes.length === 0) {
      throw new Error("File data is empty");
    }

    // Check PDF magic number
    if (mimeType === "application/pdf") {
      const header = String.fromCharCode(...bytes.slice(0, 4));
      if (!header.startsWith("%PDF")) {
        throw new Error("Invalid PDF file structure");
      }
    }

    // Check JPEG magic number
    if (mimeType === "image/jpeg") {
      if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
        throw new Error("Invalid JPEG file structure");
      }
    }

    // Check PNG magic number
    if (mimeType === "image/png") {
      if (
        bytes[0] !== 0x89 ||
        bytes[1] !== 0x50 ||
        bytes[2] !== 0x4e ||
        bytes[3] !== 0x47
      ) {
        throw new Error("Invalid PNG file structure");
      }
    }
  };

  /**
   * Download individual receipt
   */
  const downloadReceipt = async (expense) => {
    try {
      if (!expense.files || expense.files.length === 0) {
        setError("No receipt found for this expense");
        setTimeout(() => setError(""), 3000);
        return;
      }

      const file = expense.files[0];

      if (!file.data) {
        throw new Error("File data is missing");
      }

      // Convert Buffer/base64 to binary bytes
      const bytes = bufferToBytes(file.data);

      // Normalize MIME type
      const mimeType = normalizeMimeType(file.type);

      // Validate file integrity
      validateFileData(bytes, mimeType);

      // Create blob with correct MIME type
      const blob = new Blob([bytes], { type: mimeType });

      if (blob.size === 0) {
        throw new Error("Failed to create file blob");
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Get proper file extension
      const extension = getExtension(file.name, mimeType);

      // Create safe filename
      const safeExpenseType = (expense.expenseType || "expense")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      const safeAmount = (expense.amount || "0")
        .toString()
        .replace(/[^0-9.]/g, "");

      link.download = `${safeExpenseType}_${safeAmount}_receipt.${extension}`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up object URL
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setSuccess("Receipt downloaded successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error downloading receipt:", err);
      setError("Error downloading receipt: " + err.message);
      setTimeout(() => setError(""), 4000);
    }
  };

  return {
    viewDocument,
    downloadReceipt,
    error,
    success,
    setError,
    setSuccess,
  };
};
