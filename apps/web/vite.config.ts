import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig({
  server: {
    open: true,
  },
  plugins: lazyPlugins(() => [vue(), vueDevTools()]),
});
