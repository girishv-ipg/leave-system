// helper.js

import axios from "axios";

const axiosInstance = axios.create({
  baseURL: `http://${process.env.NEXT_PUBLIC_API_HOST}:4000`,
  timeout: 50000,
});

// request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // attach token if available
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // set JSON content-type only for non-FormData
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;

export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

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

export const base64ToFile = (base64, fileName, mimeType) => {
  try {
    
    if (!base64) {
      throw new Error('No base64 data provided');
    }
    
    // Remove data URL prefix if present
    let base64Data = base64;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }
    
    // Remove any whitespace or newlines
    base64Data = base64Data.replace(/\s/g, '');
    
    // Validate base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
      throw new Error('Invalid base64 string format');
    }
    
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    
    const blob = new Blob(byteArrays, { type: mimeType || 'application/octet-stream' });
    const file = new File([blob], fileName, { type: mimeType || 'application/octet-stream' });
    
    return file;
  } catch (error) {
    throw new Error('Failed to decode document: ' + error.message);
  }
};
