// hooks/useFileUpload.js

import { useState } from "react";
import { validateFile } from "@/utils/expenseHelpers";

/**
 * Hook for handling file uploads
 */
export const useFileUpload = (onError) => {
  const [file, setFile] = useState(null);

  /**
   * Handle file change event with validation
   */
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    
    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file
    const validation = validateFile(selectedFile);
    
    if (!validation.valid) {
      if (onError) {
        onError(validation.error);
      } else {
        alert(validation.error);
      }
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  /**
   * Clear selected file
   */
  const clearFile = () => {
    setFile(null);
  };

  /**
   * Reset file input
   */
  const resetFile = () => {
    setFile(null);
  };

  return {
    file,
    setFile,
    handleFileChange,
    clearFile,
    resetFile,
  };
};