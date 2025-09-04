import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test-setup.ts",
    exclude: ["**/e2e/**", "**/node_modules/**"],
    testTimeout: 10000, // 10秒に拡張
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
