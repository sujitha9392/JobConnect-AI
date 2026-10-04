import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev server runs on http://localhost:5173 (the origin allowed by the backend CORS).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
