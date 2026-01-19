// src/apis/enquiry.js
import http from "./http";

// GET /enquiry  (admin list)
export const listEnquiries = async () => {
  const { data } = await http.get("/enquiry");
  // backend: { enquiries: [...] } या direct array
  return Array.isArray(data) ? data : data.enquiries || [];
};

// PATCH /enquiry/:enquiryId  (admin update)
export const updateEnquiry = async (enquiryId, payload) => {
  const { data } = await http.put(`/enquiry/${enquiryId}`, payload);
  return data;
};
