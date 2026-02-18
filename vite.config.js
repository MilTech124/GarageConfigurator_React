import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

const isWpBuild = process.env.BUILD_TARGET === "wp";

export default defineConfig({
  plugins: [react()],
  base: isWpBuild ? "./" : "/",
  build: {
    manifest: true,
    outDir: isWpBuild
      ? "wordpress-plugin/configurator-plugin/assets/dist"
      : "dist",
    emptyOutDir: true,
  },
});
