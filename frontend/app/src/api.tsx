import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

const api = axios.create({
  // baseURL: import.meta.env.VITE_BACKEND_HOST,
  baseURL: "http://127.0.0.1:8000",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error.message);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    error.message = `${error.message}: ${error.response.data.detail || ""}`;
    return Promise.reject(error);
  },
);

export default api;
