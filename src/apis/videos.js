// src/apis/videos.js
import http from "./http";

// GET /videos  (get all videos)
export const listVideos = async () => {
  const { data } = await http.get("/videos");
  return Array.isArray(data) ? data : data.videos || [];
};

// POST /videos/add  (admin create, multipart/form-data)
export const createVideo = async (formData) => {
  const { data } = await http.post("/videos/add", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

// GET /videos/:videoId  (get single video)
export const getVideo = async (videoId) => {
  const { data } = await http.get(`/videos/${videoId}`);
  return data;
};

// DELETE /videos/:videoId  (admin delete)
export const deleteVideo = async (videoId) => {
  const { data } = await http.delete(`/videos/${videoId}`);
  return data;
};