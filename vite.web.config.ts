import { defineConfig } from "vite"
import { sharedPlugins, sharedResolve } from "./vite.shared"

export default defineConfig({
  plugins: sharedPlugins,
  resolve: sharedResolve,
  server: {
    host: true,
  },
  build: {
    outDir: "dist-web",
  },
})
