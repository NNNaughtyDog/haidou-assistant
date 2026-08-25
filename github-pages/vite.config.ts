import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: import.meta.dirname,
  base: process.env.HAIDOU_BASE || "/haidou-assistant/",
  plugins: [react()],
  resolve: {
    // The app source lives outside this package. Always resolve React from the
    // static-site package so hooks and the renderer share one React instance.
    dedupe: ["react", "react-dom"],
  },
});
