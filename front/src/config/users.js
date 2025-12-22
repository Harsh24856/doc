import axios from "axios";
import API_BASE_URL from "./api.js";

export const fetchUsers = async () => {
  const res = await axios.get(`${API_BASE_URL}/users`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};