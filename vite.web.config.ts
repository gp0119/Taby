import { defineConfig } from "vite"
import { sharedPlugins, sharedResolve } from "./vite.shared"

export default defineConfig({
  plugins: sharedPlugins,
  resolve: sharedResolve,
  build: {
    outDir: "dist-web",
  },
})
