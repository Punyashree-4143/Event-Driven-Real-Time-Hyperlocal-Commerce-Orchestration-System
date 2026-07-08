const DEFAULT_API_ORIGIN = "http://localhost:5000";

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

const rawApiUrl = import.meta.env.VITE_API_URL || DEFAULT_API_ORIGIN;
const normalizedApiUrl = trimTrailingSlash(rawApiUrl);

export const API_ORIGIN = normalizedApiUrl.endsWith("/api")
  ? normalizedApiUrl.slice(0, -4)
  : normalizedApiUrl;

export const API_BASE_URL = `${API_ORIGIN}/api`;

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || API_ORIGIN;

export const parseApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body?.message
        ? body.message
        : `Request failed with ${response.status} ${response.statusText}`;

    throw new Error(message);
  }

  return body;
};

export const apiFetch = async (path, options = {}) => {
  const endpoint = path.startsWith("/") ? path : `/${path}`;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

  return parseApiResponse(response);
};