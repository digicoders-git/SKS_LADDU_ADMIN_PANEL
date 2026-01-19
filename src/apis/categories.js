// src/apis/categories.js
import http from "./http";

// Public Get – GET {{baseUrl}}/categories
export const getCategories = async (status = 'active') => {
  const params = status ? { status } : {};
  const { data } = await http.get("/categories", { params });
  return data; // expect: array of categories
};

// Admin Add – POST {{baseUrl}}/categories (Token via interceptor)
export const createCategory = async (payload) => {
  const { data } = await http.post("/categories", payload);
  return data; // could be { message, category } or category
};

// Admin Update – PUT {{baseUrl}}/categories/:idOrSlug (Token)
export const updateCategory = async (idOrSlug, payload) => {
  const { data } = await http.put(`/categories/${idOrSlug}`, payload);
  return data;
  // NOTE: If backend uses PATCH instead of PUT, change to http.patch(...)
};

// Admin Delete – DELETE {{baseUrl}}/categories/:idOrSlug (Token)
export const deleteCategory = async (idOrSlug) => {
  const { data } = await http.delete(`/categories/${idOrSlug}`);
  return data;
};
