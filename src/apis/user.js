import http from "./http";

// getall 
export const getAllUsers = async () => {
  const { data } = await http.get("/users/getAll");
  return data;
};
