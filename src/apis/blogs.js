// src/apis/blogs.js
import http from "./http";

// Admin: Get all blogs - GET /api/blogs/admin/all
export const getAllBlogs = async (page = 1, limit = 10) => {
  const { data } = await http.get(`/api/blogs/admin/all?page=${page}&limit=${limit}`);
  return data;
};

// Admin: Create blog - POST /api/blogs/admin
export const createBlog = async (blogData) => {
  const { data } = await http.post("/api/blogs/admin", blogData);
  return data;
};

// Admin: Update blog - PUT /api/blogs/admin/:idOrSlug
export const updateBlog = async (idOrSlug, blogData) => {
  try {
    const { data } = await http.put(`/api/blogs/admin/${idOrSlug}`, blogData);
    return data;
  } catch (error) {
    console.error('PUT failed, trying PATCH:', error.response?.status);
    
    // Try PATCH as fallback
    if (error.response?.status === 500 || error.response?.status === 405) {
      try {
        const { data } = await http.patch(`/api/blogs/admin/${idOrSlug}`, blogData);
        return data;
      } catch (patchError) {
        console.error('PATCH also failed:', patchError.response?.data);
        throw patchError;
      }
    }
    
    console.error('Backend error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

// Admin: Delete blog - DELETE /api/blogs/admin/:idOrSlug
export const deleteBlog = async (idOrSlug) => {
  const { data } = await http.delete(`/api/blogs/admin/${idOrSlug}`);
  return data;
};

// Public: Get published blogs - GET /api/blogs
export const getPublishedBlogs = async (page = 1, limit = 10) => {
  const { data } = await http.get(`/api/blogs?page=${page}&limit=${limit}`);
  return data;
};

// Public: Get single blog - GET /api/blogs/:idOrSlug
export const getSingleBlog = async (idOrSlug) => {
  const { data } = await http.get(`/api/blogs/${idOrSlug}`);
  return data;
};

// Public: Get featured blogs - GET /api/blogs/featured
export const getFeaturedBlogs = async () => {
  const { data } = await http.get("/api/blogs/featured");
  return data;
};

// Public: Like blog - POST /api/blogs/:idOrSlug/like
export const likeBlog = async (idOrSlug) => {
  const { data } = await http.post(`/api/blogs/${idOrSlug}/like`);
  return data;
};