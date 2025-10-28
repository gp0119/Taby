import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import AutoImport from "unplugin-auto-import/vite"
import Components from "unplugin-vue-components/vite"
import { NaiveUiResolver } from "unplugin-vue-components/resolvers"
import vueJsx from "@vitejs/plugin-vue-jsx"
import { crx } from "@crxjs/vite-plugin"
import manifest from "./manifest.config"
import zip from "vite-plugin-zip-pack"
import fs from "fs"
import path from "path"

export default defineConfig({
  plugins: [
    vue(),
    crx({ manifest }),
    zip({ outDir: "release", outFileName: "release.zip" }),
    vueJsx({}),
    {
      name: "remove-vite-manifest",
      closeBundle() {
        const manifestPath = path.resolve(__dirname, "dist/.vite/manifest.json")
        if (fs.existsSync(manifestPath)) {
          fs.unlinkSync(manifestPath)
          const viteDir = path.resolve(__dirname, "dist/.vite")
          if (fs.readdirSync(viteDir).length === 0) {
            fs.rmdirSync(viteDir)
          }
        }
      },
    },
    AutoImport({
      imports: [
        "vue",
        {
          "naive-ui": [
            "useDialog",
            "useMessage",
            "useNotification",
            "useLoadingBar",
          ],
        },
      ],
      dts: "src/auto-imports.d.ts",
      eslintrc: {
        enabled: true,
        filepath: "./.eslintrc-auto-import.json",
        globalsPropValue: true,
      },
    }),
    Components({
      resolvers: [NaiveUiResolver()],
    }),
  ],
  resolve: {
    alias: [
      { find: "@", replacement: "/src" },
      { find: "@components", replacement: "/src/components" },
    ],
  },
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
})
