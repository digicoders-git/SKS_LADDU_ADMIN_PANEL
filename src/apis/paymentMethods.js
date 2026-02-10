import http from "./http";

// Get all payment methods
export const getPaymentMethods = async () => {
  const { data } = await http.get("/method/get");
  return data; // Direct array return
};

// Update payment method status
export const updatePaymentMethodStatus = async (id, status) => {
  const { data } = await http.patch(`/method/${id}/status`, { status });
  return data;
};

// Update payment method name
export const updatePaymentMethodName = async (id, name) => {
  const { data } = await http.patch(`/method/${id}/name`, { name });
  return data;
};
