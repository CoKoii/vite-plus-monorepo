import { defineConfig } from "vite-plus";

export default defineConfig({
  build: {
    ssr: "src/main.ts",
    outDir: "dist",
    emptyOutDir: true,
  },
});
