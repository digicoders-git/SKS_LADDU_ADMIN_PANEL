import http from "./http";

export const adminLogin = async ({ adminId, password }) => {
  const { data } = await http.post("/admin/login", {
    adminId,
    password,
  });

  return data; 
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  const { data } = await http.post("/admin/change-password", {
    currentPassword,
    newPassword,
  });
  return data;
};
