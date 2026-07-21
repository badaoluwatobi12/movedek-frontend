import { API_BASE_URL } from "@/services/apiBase";

export type ClientErrorSource =
  "error-boundary" | "window-error" | "unhandled-rejection";

export type ClientErrorReport = {
  source: ClientErrorSource;
  message: string;
  name?: string;
  stack?: string;
  metadata?: Record<string, unknown>;
};

const reportingEnabled =
  (import.meta.env.VITE_ERROR_REPORTING_ENABLED as string | undefined) !==
  "false";

function truncate(value: string | undefined, max: number) {
  return value?.slice(0, max);
}

function toError(value: unknown) {
  if (value instanceof Error) return value;
  if (typeof value === "string") return new Error(value);

  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error("Unknown client error");
  }
}

export function reportClientError(report: ClientErrorReport) {
  if (!reportingEnabled || typeof window === "undefined") return;

  const body = JSON.stringify({
    source: report.source,
    message: truncate(report.message, 1_000),
    name: truncate(report.name, 200),
    stack: truncate(report.stack, 12_000),
    url: truncate(window.location.href, 2_000),
    userAgent: truncate(window.navigator.userAgent, 1_000),
    occurredAt: new Date().toISOString(),
    metadata: report.metadata,
  });

  void fetch(`${API_BASE_URL}/observability/client-errors`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": crypto.randomUUID(),
    },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

let installed = false;

export function installGlobalErrorReporting() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    const error = toError(event.error ?? event.message);
    reportClientError({
      source: "window-error",
      message: error.message,
      name: error.name,
      stack: error.stack,
      metadata: {
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const error = toError(event.reason);
    reportClientError({
      source: "unhandled-rejection",
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
  });
}
