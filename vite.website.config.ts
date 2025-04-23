import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import AutoImport from "unplugin-auto-import/vite"
import vueJsx from "@vitejs/plugin-vue-jsx"
import path from "path"

export default defineConfig({
  root: path.resolve(__dirname, "website"),
  plugins: [
    vue(),
    vueJsx({}),
    AutoImport({
      imports: ["vue"],
      dts: "src/auto-imports.d.ts",
    }),
  ],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      {
        find: "@components",
        replacement: path.resolve(__dirname, "src/components"),
      },
    ],
  },
  build: {
    outDir: path.resolve(__dirname, "site"),
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "./website/index.html"),
      },
    },
  },
})
