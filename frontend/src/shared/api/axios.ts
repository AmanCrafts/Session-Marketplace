import axios, { AxiosError, type AxiosInstance } from "axios";
import type { ApiErrorEnvelope } from "./types";
import { getSupabase } from "./supabase";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Attach the current Supabase access token to every request automatically.
api.interceptors.request.use(async (config) => {
  try {
    const { data } = await getSupabase().auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    /* not configured yet — let the request hit and 401 */
  }
  return config;
});

export class ApiError extends Error {
  code: string;
  status: number;
  raw: unknown;

  constructor(code: string, message: string, status: number, raw?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.raw = raw;
  }

  /** True for backend "envelope" errors thrown via DomainError. */
  static isApiError(err: unknown): err is ApiError {
    return err instanceof ApiError;
  }

  /** Convert DRF envelopes into friendly field-error maps for forms. */
  fieldErrors(): Record<string, string> {
    const detail = (this.raw as ApiErrorEnvelope | undefined)?.error?.detail;
    if (!detail || typeof detail !== "object" || Array.isArray(detail)) {
      return {};
    }
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(
      detail as Record<string, unknown>
    )) {
      if (Array.isArray(value) && value.length > 0) {
        out[key] = String(value[0]);
      } else if (typeof value === "string") {
        out[key] = value;
      }
    }
    return out;
  }
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorEnvelope>) => {
    const env = error.response?.data;
    if (env?.error) {
      return Promise.reject(
        new ApiError(
          env.error.code ?? "api_error",
          typeof env.error.detail === "string"
            ? env.error.detail
            : "Request failed.",
          error.response?.status ?? 500,
          env
        )
      );
    }
    return Promise.reject(
      new ApiError(
        "network_error",
        error.message || "Network error.",
        error.response?.status ?? 0
      )
    );
  }
);
