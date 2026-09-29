import { defineConfig } from "vite"
import { crx } from "@crxjs/vite-plugin"
import manifest from "./manifest.config.ts"
import pkg from "./package.json" with { type: "json" }
import { sharedPlugins, sharedResolve } from "./vite.shared.ts"
import zip from "vite-plugin-zip-pack"
import fs from "fs"
import path from "path"

export default defineConfig({
  plugins: [
    ...sharedPlugins,
    crx({ manifest }),
    zip({ outDir: "release", outFileName: `${pkg.version}.zip` }),
    {
      name: "remove-vite-manifest",
      closeBundle() {
        const manifestPath = path.resolve(
          import.meta.dirname,
          "dist/.vite/manifest.json",
        )
        if (fs.existsSync(manifestPath)) {
          fs.unlinkSync(manifestPath)
          const viteDir = path.resolve(import.meta.dirname, "dist/.vite")
          if (fs.readdirSync(viteDir).length === 0) {
            fs.rmdirSync(viteDir)
          }
        }
      },
    },
  ],
  resolve: sharedResolve,
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
})
