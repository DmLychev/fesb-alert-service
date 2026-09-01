import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";
import { jwtDecode, type JwtPayload } from "jwt-decode";

interface TokenRefreshResponse {
  access: string;
  refresh?: string;
}

const TOKEN_EXPIRATION_MARGIN_SECONDS = 10;

const authApi = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_BASE_URL_DEV ?? "",
});

let refreshPromise: Promise<string | null> | null = null;

export const getAccessToken = (): string | null =>
  localStorage.getItem(ACCESS_TOKEN);

export const getRefreshToken = (): string | null =>
  localStorage.getItem(REFRESH_TOKEN);

export const saveAccessToken = (token: string): void =>
  localStorage.setItem(ACCESS_TOKEN, token);

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
};

export const isTokenExpired = (
  token: string,
  marginSeconds = TOKEN_EXPIRATION_MARGIN_SECONDS,
): boolean => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);

    if (typeof decoded.exp !== "number") return true;

    const expirationThreshold = Date.now() / 1000 + marginSeconds;

    return decoded.exp <= expirationThreshold;
  } catch {
    return true;
  }
};

const performTokenRefresh = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken || isTokenExpired(refreshToken, 0)) {
    clearTokens();
    return null;
  }

  try {
    const response = await authApi.post<TokenRefreshResponse>(
      "/api/token/refresh/",
      { refresh: refreshToken },
    );

    const newAccessToken = response.data.access;

    saveAccessToken(newAccessToken);

    if (response.data.refresh) {
      localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
    }

    return newAccessToken;
  } catch {
    clearTokens();
    return null;
  }
};

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = performTokenRefresh().finally(() => (refreshPromise = null));

  return refreshPromise;
};

export const getValidAccessToken = async (): Promise<string | null> => {
  const accessToken = getAccessToken();

  if (accessToken && !isTokenExpired(accessToken)) return accessToken;

  return refreshAccessToken();
};

export const hasValidSession = async (): Promise<boolean> => {
  const token = await getValidAccessToken();

  return token !== null;
};
