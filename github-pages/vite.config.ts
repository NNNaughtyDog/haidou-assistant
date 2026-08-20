import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: import.meta.dirname,
  base: process.env.HAIDOU_BASE || "/haidou-assistant/",
  plugins: [react()],
});
