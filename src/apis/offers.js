// src/apis/offers.js
import http from "./http";

// GET /api/offers  (admin list)
export const listOffers = async () => {
  const { data } = await http.get("/api/offers");
  // backend: { offers: [...] }
  return data.offers || data;
};

// POST /api/offers (admin create)
export const createOffer = async (payload) => {
  const { data } = await http.post("/api/offers", payload);
  return data;
};

// PUT /api/offers/:offerId (admin update)
export const updateOffer = async (offerId, payload) => {
  const { data } = await http.put(`/api/offers/${offerId}`, payload);
  return data;
};

// DELETE /api/offers/:offerId (admin delete)
export const deleteOffer = async (offerId) => {
  const { data } = await http.delete(`/api/offers/${offerId}`);
  return data;
};
