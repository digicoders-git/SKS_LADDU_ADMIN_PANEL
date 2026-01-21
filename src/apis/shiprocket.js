// src/apis/shiprocket.js
import http from "./http";

// Create Shiprocket order for existing order
export const createShiprocketOrder = async (orderId) => {
  const { data } = await http.post(`/shiprocket/create-order/${orderId}`);
  return data;
};

// Get Shiprocket tracking info
export const getShiprocketTracking = async (awbCode) => {
  const { data } = await http.get(`/shiprocket/track/${awbCode}`);
  return data;
};

// Cancel Shiprocket order
export const cancelShiprocketOrder = async (orderId) => {
  const { data } = await http.post(`/shiprocket/cancel-order/${orderId}`);
  return data;
};