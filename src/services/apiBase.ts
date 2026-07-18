const DEFAULT_LOCAL_API_URL = "http://localhost:5051/api";
const PRODUCTION_API_URL = "https://api.movedek.com/api";
const PRODUCTION_HOSTNAMES = new Set(["movedek.com", "www.movedek.com"]);

const normalizeUrl = (url?: string) => url?.trim().replace(/\/+$/, "");

export function resolveApiBaseUrl(envUrl?: string, hostname?: string) {
  const normalizedHostname = hostname?.toLowerCase();

  // Production/custom domain should always use the API subdomain.
  // This protects the deployed app from an old Vercel env value that still
  // points to localhost or the wrong Render URL.
  if (normalizedHostname && PRODUCTION_HOSTNAMES.has(normalizedHostname)) {
    return PRODUCTION_API_URL;
  }

  return normalizeUrl(envUrl) || DEFAULT_LOCAL_API_URL;
}

export function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  const hostname = typeof window !== "undefined" ? window.location.hostname : undefined;
  return resolveApiBaseUrl(envUrl, hostname);
}

export const API_BASE_URL = getApiBaseUrl();
