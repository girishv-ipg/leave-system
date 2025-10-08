import axios from "axios";

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: `http://${process.env.NEXT_PUBLIC_API_HOST}:4000`,
  timeout: 50000,
});

// Add a request interceptor to set Content-Type for JSON requests only
axiosInstance.interceptors.request.use(
  (config) => {
    // Only set application/json for requests that aren't FormData
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    // For FormData, let the browser set the Content-Type with boundary
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;

export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};
