/**
 * Decodes base64 file data and opens it in a new window
 * Handles PDFs and images (JPEG, JPG, PNG)
 * @param {Object} expense - Expense object containing files array
 */
const handleViewDocument = async (expense) => {
  try {
    // Validate file exists
    if (!expense.files?.length) {
      alert("No document found for this expense");
      return;
    }

    const file = expense.files[0];
    
    if (!file.data) {
      throw new Error("File data is missing");
    }

    // Decode base64 to binary
    const binaryString = decodeBase64(file.data);
    
    // Verify file integrity
    validateFileSignature(binaryString, file.type);

    // Create blob and open/download
    const blob = createBlobFromBinary(binaryString, file.type);
    openOrDownloadFile(blob, file.name, file.type);

  } catch (error) {
    console.error("Error viewing document:", error);
    alert(`Error viewing document: ${error.message}\n\nThe file may be corrupted. Please try re-uploading it.`);
  }
};

/**
 * Decodes base64 string, handling double-encoding if necessary
 * @param {string} base64Data - Base64 encoded string
 * @returns {string} Binary string
 */
const decodeBase64 = (base64Data) => {
  // Clean and normalize base64 string
  let cleanData = base64Data.trim().replace(/\s+/g, "");
  
  // Remove data URL prefix if present
  if (cleanData.includes(",")) {
    cleanData = cleanData.split(",")[1];
  }

  // First decode attempt
  let binaryString = atob(cleanData);

  // Check if double-encoded (binary looks like base64)
  const isDoubleEncoded = /^[A-Za-z0-9+/=]{20,}/.test(binaryString);
  
  if (isDoubleEncoded && !hasValidFileSignature(binaryString)) {
    console.warn("⚠️ Double-encoded base64 detected. Decoding again...");
    try {
      binaryString = atob(binaryString);
    } catch (e) {
      throw new Error("File is corrupted or improperly encoded");
    }
  }

  return binaryString;
};

/**
 * Checks if binary string has valid file signature
 * @param {string} binaryString - Binary data string
 * @returns {boolean} True if valid signature found
 */
const hasValidFileSignature = (binaryString) => {
  const bytes = Array.from(binaryString.substring(0, 4)).map(c => c.charCodeAt(0));
  
  // PDF: %PDF
  if (binaryString.startsWith("%PDF")) return true;
  
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
  
  // JPEG/JPG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
  
  return false;
};

/**
 * Validates file signature matches expected MIME type
 * @param {string} binaryString - Binary data string
 * @param {string} mimeType - Expected MIME type
 * @throws {Error} If signature doesn't match MIME type
 */
const validateFileSignature = (binaryString, mimeType) => {
  const bytes = Array.from(binaryString.substring(0, 4)).map(c => c.charCodeAt(0));
  const normalizedMimeType = mimeType.toLowerCase();
  
  // Detect actual file type
  let detectedType = "unknown";
  
  if (binaryString.startsWith("%PDF")) {
    detectedType = "pdf";
  } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    detectedType = "png";
  } else if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    detectedType = "jpeg";
  }

  // Validate MIME type matches signature
  const expectedTypes = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpeg",
    "image/jpg": "jpeg"
  };

  const expectedType = expectedTypes[normalizedMimeType];
  
  if (!expectedType) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
  
  if (detectedType !== expectedType) {
    throw new Error(
      `File signature mismatch. Expected ${expectedType.toUpperCase()} but got ${detectedType.toUpperCase()}`
    );
  }
};

/**
 * Creates Blob from binary string
 * @param {string} binaryString - Binary data string
 * @param {string} mimeType - MIME type
 * @returns {Blob} Created blob
 */
const createBlobFromBinary = (binaryString, mimeType) => {
  // Convert to Uint8Array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Normalize MIME type (jpg -> jpeg)
  const normalizedMimeType = mimeType === "image/jpg" ? "image/jpeg" : mimeType;
  
  const blob = new Blob([bytes], { type: normalizedMimeType });

  if (blob.size === 0) {
    throw new Error("Generated blob is empty");
  }

  return blob;
};

/**
 * Opens file in new window or downloads if popup blocked
 * @param {Blob} blob - File blob
 * @param {string} fileName - Name of the file
 * @param {string} mimeType - MIME type
 */
const openOrDownloadFile = (blob, fileName, mimeType) => {
  const url = URL.createObjectURL(blob);
  
  // Handle images differently from PDFs
  if (mimeType.startsWith("image/")) {
    openImageInNewWindow(url, fileName);
  } else {
    openPDFInNewWindow(url, fileName);
  }

  // Cleanup after 30 seconds
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

/**
 * Opens image in styled HTML page
 * @param {string} url - Blob URL
 * @param {string} fileName - File name
 */
const openImageInNewWindow = (url, fileName) => {
  const newWindow = window.open("", "_blank");
  
  if (newWindow) {
    newWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${fileName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #1a1a1a;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            .container {
              max-width: 95vw;
              max-height: 95vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 20px;
              padding: 20px;
            }
            .filename {
              color: #fff;
              font-size: 16px;
              font-weight: 500;
              text-align: center;
              word-break: break-word;
            }
            img {
              max-width: 100%;
              max-height: 85vh;
              object-fit: contain;
              border-radius: 8px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="filename">${fileName}</div>
            <img src="${url}" alt="${fileName}" />
          </div>
        </body>
      </html>
    `);
  } else {
    downloadFile(url, fileName);
  }
};

/**
 * Opens PDF in new window
 * @param {string} url - Blob URL
 * @param {string} fileName - File name
 */
const openPDFInNewWindow = (url, fileName) => {
  const newWindow = window.open(url, "_blank");
  
  if (!newWindow) {
    downloadFile(url, fileName);
  }
};

/**
 * Downloads file (fallback when popup blocked)
 * @param {string} url - Blob URL
 * @param {string} fileName - File name
 */
const downloadFile = (url, fileName) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "download";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  alert("Popup blocked. File download started instead.");
};

// Export for use in component
export { handleViewDocument };