// src/apis/enquiry.js
import http from "./http";

// GET /enquiry  (admin list)
export const listEnquiries = async (page = 1, limit = 10) => {
  const { data } = await http.get(`/enquiry?page=${page}&limit=${limit}`);
  return data;
};

// PATCH /enquiry/:enquiryId  (admin update)
export const updateEnquiry = async (enquiryId, payload) => {
  const { data } = await http.put(`/enquiry/${enquiryId}`, payload);
  return data;
};
