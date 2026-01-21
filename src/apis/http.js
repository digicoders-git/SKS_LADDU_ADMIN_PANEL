// src/apis/http.js
import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach token for every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin-token");
  const tokenExpiry = localStorage.getItem("admin-token-expiry");
  
  // Check if token is expired before making request
  if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
    // Token expired, clear localStorage
    localStorage.removeItem("admin-data");
    localStorage.removeItem("admin-token");
    localStorage.removeItem("admin-token-expiry");
    // Redirect to login or refresh page
    window.location.href = "/login";
    return Promise.reject(new Error("Token expired"));
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors (like 401 unauthorized)
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid/expired, clear localStorage
      localStorage.removeItem("admin-data");
      localStorage.removeItem("admin-token");
      localStorage.removeItem("admin-token-expiry");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default http;
