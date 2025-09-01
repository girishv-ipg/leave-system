import axios from "axios";

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: "http://IPGNB10348:4000/",
  // baseURL: "http://localhost:4000/",
  timeout: 50000,
  headers: {
    "Content-Type": "application/json",
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
