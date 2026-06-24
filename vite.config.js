import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The TOOB page files use the legacy window-global pattern (no exports),
// so React Fast Refresh just falls back to a full reload for them — fine.
export default defineConfig({
  plugins: [react()],
  server: { open: true },
});
