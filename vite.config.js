import { defineConfig } from "vite";
export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      fileName: "index",
      formats: ["es"],
    },
  },
  test: {
    environment: "node",
    coverage: {
      reporter: ["text", "lcov", "clover"],
    },
  },
});
