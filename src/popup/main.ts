import { createApp } from "vue"
import "../style.css"
import App from "./app.vue"
import { createPinia } from "pinia"
import zhCN from "../i18n/zh-CN.ts"
import enUS from "../i18n/en-US.ts"
import { createI18n } from "vue-i18n"

const pinia = createPinia()
const i18n = createI18n({
  locale: "en-US",
  legacy: false,
  globalInjection: true,
  messages: {
    "zh-CN": zhCN,
    "en-US": enUS,
  },
})

createApp(App).use(pinia).use(i18n).mount("#app")
