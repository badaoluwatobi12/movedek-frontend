import { describe, expect, it } from "vitest";
import { resolveApiBaseUrl } from "../apiBase";

describe("resolveApiBaseUrl", () => {
  it("uses the local backend when no Vite API URL is configured", () => {
    expect(resolveApiBaseUrl(undefined, "localhost")).toBe("http://localhost:5051/api");
  });

  it("removes trailing slashes from configured URLs", () => {
    expect(resolveApiBaseUrl("https://example.com/api///", "preview.vercel.app")).toBe(
      "https://example.com/api",
    );
  });

  it("forces the production API domain on the Movedek public website", () => {
    expect(resolveApiBaseUrl("http://localhost:5051/api", "www.movedek.com")).toBe(
      "https://api.movedek.com/api",
    );
  });
});
