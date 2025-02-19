import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import AutoImport from "unplugin-auto-import/vite"
import Components from "unplugin-vue-components/vite"
import { NaiveUiResolver } from "unplugin-vue-components/resolvers"
import vueJsx from "@vitejs/plugin-vue-jsx"
import copy from "rollup-plugin-copy"
import path from "path"

export default defineConfig({
  plugins: [
    vue(),
    vueJsx({}),
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
    copy({
      targets: [
        { src: "manifest.json", dest: "dist" }, // 复制 manifest.json 到 dist 目录
        { src: "src/assets/**", dest: "dist/icons" }, // 复制 src/icons/** 到 dist/icons 目录
      ],
      copySync: true,
      hook: "writeBundle",
    }),
  ],
  resolve: {
    alias: [
      { find: "@", replacement: "/src" },
      { find: "@components", replacement: "/src/components" },
    ],
  },
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "index.html"),
      },
      output: {
        assetFileNames: "assets/[name]-[hash].[ext]", // 静态资源
        chunkFileNames: "js/[name]-[hash].js", // 代码分割中产生的 chunk
        name: "[name].js",
      },
    },
  },
})
