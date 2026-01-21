import http from "./http";

// getall 
export const getAllUsers = async (page = 1, limit = 10) => {
  const { data } = await http.get(`/users/getAll?page=${page}&limit=${limit}`);
  return data;
};
