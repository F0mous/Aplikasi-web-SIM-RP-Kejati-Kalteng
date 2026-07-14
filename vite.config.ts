import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative assets make the build work on GitHub project pages
  // without hard-coding the repository name.
  base: "./",
});
