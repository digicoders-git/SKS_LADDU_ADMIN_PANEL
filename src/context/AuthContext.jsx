// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

const USER_KEY = "admin-data";
const TOKEN_KEY = "admin-token";
const TOKEN_EXPIRY_KEY = "admin-token-expiry";

export const AuthProvider = ({ children }) => {
  // admin object: { adminId, name, id, token }
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null); // string
  const [loading, setLoading] = useState(true);

  // hydrate from localStorage (persisted login)
  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

    // Check if token is expired
    if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
      // Token expired, clear everything
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      setLoading(false);
      return;
    }

    if (savedUser) {
      try {
        setAdmin(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error parsing saved admin data", e);
        localStorage.removeItem(USER_KEY);
      }
    }

    if (savedToken) {
      setToken(savedToken);
    }

    setLoading(false);
  }, []);

  const setLoginData = (adminData) => {
    setAdmin(adminData);
    setToken(adminData?.token || null);

    localStorage.setItem(USER_KEY, JSON.stringify(adminData));
    if (adminData?.token) {
      localStorage.setItem(TOKEN_KEY, adminData.token);
      // Set expiry time to 7 days from now
      const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
    }
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  };

  const isLoggedIn = Boolean(admin && token);

  return (
    <AuthContext.Provider
      value={{ admin, token, setLoginData, logout, isLoggedIn, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
