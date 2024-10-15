import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { crx, ManifestV3Export } from "@crxjs/vite-plugin"
import manifest from "./manifest.json" assert { type: "json" }
import AutoImport from "unplugin-auto-import/vite"
import Components from "unplugin-vue-components/vite"
import { NaiveUiResolver } from "unplugin-vue-components/resolvers"
import vueJsx from "@vitejs/plugin-vue-jsx"
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx({}),
    crx({ manifest: manifest as ManifestV3Export }),
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
  // build: {
  //   rollupOptions: {
  //     input: {
  //       popup: "src/popup.html",
  //     },
  //   },
  // },
})
