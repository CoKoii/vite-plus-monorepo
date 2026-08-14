import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/main.ts"],
    clean: true,
    deps: {
      neverBundle: true,
    },
  },
});
