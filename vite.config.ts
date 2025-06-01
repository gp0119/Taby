import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import AutoImport from "unplugin-auto-import/vite"
import Components from "unplugin-vue-components/vite"
import { NaiveUiResolver } from "unplugin-vue-components/resolvers"
import vueJsx from "@vitejs/plugin-vue-jsx"
import copy from "rollup-plugin-copy"
import path from "path"

const isWatch = process.argv.includes("--watch")
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
      eslintrc: {
        enabled: true,
        filepath: "./.eslintrc-auto-import.json",
        globalsPropValue: true,
      },
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
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: !isWatch,
    rollupOptions: {
      input: {
        newtab: path.resolve(__dirname, "newtab.html"),
        background: path.resolve(__dirname, "src/background/service-worker.ts"),
      },
      output: {
        assetFileNames: "assets/[name]-[hash].[ext]", // 静态资源
        chunkFileNames: "common/[name]-[hash].js", // 代码分割中产生的 chunk
        name: "[name].js",
        manualChunks: {
          "naive-vendor": ["naive-ui"],
          "sortable-vendor": ["vue-draggable-plus"],
          "vue-virtual-vendor": ["vue-virtual-scroller"],
          "dexie-vendor": ["dexie"],
          "vue-vendor": ["vue", "pinia", "vue-i18n", "@vueuse/core"],
          "svg-vendor": ["@vicons/ionicons5", "@vicons/carbon"],
          libs: ["lodash-es", "dayjs", "lz-string"],
        },
        entryFileNames: (chunkInfo) => {
          // 入口文件
          const baseName = path.basename(
            chunkInfo.facadeModuleId!,
            path.extname(chunkInfo.facadeModuleId!),
          )
          const saveArr = ["content", "service-worker", "newtab"]
          return `[name]/${saveArr.includes(baseName) ? baseName : chunkInfo.name}.js`
        },
      },
    },
  },
})
