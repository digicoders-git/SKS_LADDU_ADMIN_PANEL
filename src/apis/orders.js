// src/apis/orders.js
import http from "./http";

// GET /orders  (admin list)
export const listOrders = async () => {
  const { data } = await http.get("/orders");
  // backend: { orders: [...] } ya direct array
  return Array.isArray(data) ? data : data.orders || [];
};

// PUT /orders/:orderId/status  (admin update status)
export const updateOrderStatus = async (orderId, status) => {
  const { data } = await http.put(`/orders/${orderId}/status`, {
    status,
  });
  return data;
};

// GET /orders/:orderId  (admin get single order)
export const getOrder = async (orderId) => {
  const { data } = await http.get(`/orders/${orderId}`);
  return data.order || data;
};

// GET /orders/track/:awbCode  (tracking)
export const trackOrder = async (awbCode) => {
  const { data } = await http.get(`/orders/track/${awbCode}`);
  return data.trackingData || data;
};