// sshs-frontend/src/services/api.js
import axios from "axios";

const api = axios.create({
  // backend routes all start with /api
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  // send cookies (session / httpOnly JWT) with every request
  withCredentials: true,
});

export default api;
