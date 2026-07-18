import { API_BASE_URL } from "./apiBase";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface HttpOptions extends RequestInit {
  token?: string | null;
}

const isJsonBody = (body: BodyInit | null | undefined) => body !== undefined && !(body instanceof FormData);

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

function hasMessage(value: unknown): value is { message: string } {
  return (
    typeof value === "object" && value !== null && "message" in value && typeof value.message === "string"
  );
}

function hasData<T>(value: unknown): value is ApiEnvelope<T> {
  return typeof value === "object" && value !== null && "data" in value;
}

export async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (isJsonBody(options.body)) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);

  headers.set("Cache-Control", "no-cache");
  headers.set("Pragma", "no-cache");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    credentials: "include",
    ...options,
    headers,
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new HttpError(
      response.status,
      hasMessage(body) ? body.message : `Request failed with status ${response.status}`,
      body,
    );
  }

  return hasData<T>(body) ? body.data : (body as T);
}
