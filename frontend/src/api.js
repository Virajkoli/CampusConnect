import axios from "axios";

const API = String(import.meta.env.VITE_API_URL || "http://localhost:5000")
  .trim()
  .replace(/\/+$/, "");

export const fetchPosts = async () => {
  const response = await axios.get(`${API}/posts`);
  return response.data;
};
