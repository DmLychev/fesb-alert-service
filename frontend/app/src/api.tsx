import axios, { type InternalAxiosRequestConfig } from "axios";
import { getValidAccessToken, refreshAccessToken } from "./auth";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_HOST,
});

api.interceptors.request.use(
  async (config) => {
    const token = await getValidAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      config.headers.delete("Authorization");
    }

    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,

  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const newAccessToken = await refreshAccessToken();

      if (newAccessToken) {
        originalRequest.headers.set(
          "Authorization",
          `Bearer ${newAccessToken}`,
        );

        return api(originalRequest);
      }

      const responseData = error.response?.data;

      if (
        typeof responseData === "object" &&
        responseData !== null &&
        "detail" in responseData &&
        typeof responseData.detail === "string"
      )
        error.message = `${error.message}: ` + responseData.detail;

      return Promise;
    }

    return Promise.reject(error);
  },
);

export default api;
