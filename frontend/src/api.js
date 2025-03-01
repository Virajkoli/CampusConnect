import axios from "axios";

const API = "http://localhost:5000";

export const fetchPosts = async () => {
  const response = await axios.get(`${API}/posts`);
  return response.data;
};
