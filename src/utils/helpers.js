import axios from "axios";

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: "http://172.30.60.22:3001", // Your local server's base URL
  timeout: 10000, // Request timeout in ms
  headers: {
    "Content-Type": "application/json", // Ensure you're sending JSON data
  },
});

export default axiosInstance;

export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};
