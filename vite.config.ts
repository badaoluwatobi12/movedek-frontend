import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const firstExisting = (...candidates: string[]) => {
  const match = candidates.find((candidate) => fs.existsSync(candidate));
  if (!match) {
    throw new Error(
      `Unable to resolve dependency path: ${candidates.join(", ")}`,
    );
  }
  return match;
};

const sharedSource = firstExisting(
  path.resolve(__dirname, "../packages/shared/src/index.ts"),
  path.resolve(__dirname, "node_modules/@movedek/shared/src/index.ts"),
);

const zodPackage = firstExisting(
  path.resolve(__dirname, "../node_modules/zod"),
  path.resolve(__dirname, "node_modules/zod"),
);

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@movedek/shared": sharedSource,
      zod: zodPackage,
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
      "zod",
    ],
  },
});
