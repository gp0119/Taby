import { defineConfig } from "vite"
import { sharedPlugins, sharedResolve } from "./vite.shared.ts"

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
