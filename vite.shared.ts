import vue from "@vitejs/plugin-vue"
import vueJsx from "@vitejs/plugin-vue-jsx"
import AutoImport from "unplugin-auto-import/vite"
import Components from "unplugin-vue-components/vite"
import { NaiveUiResolver } from "unplugin-vue-components/resolvers"

export const sharedPlugins = [
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
]

export const sharedResolve = {
  alias: [
    { find: "@", replacement: "/src" },
    { find: "@components", replacement: "/src/components" },
  ],
}
