import { createApp } from "vue"
import "./style.css"
import App from "./App.vue"
import { createPinia } from "pinia"
import { createI18n } from "vue-i18n"
import zhCN from "./i18n/zh-CN.ts"
import enUS from "./i18n/en-US.ts"

const pinia = createPinia()
const app = createApp(App)
const i18n = createI18n({
  locale: "en-US",
  legacy: false,
  globalInjection: true,
  messages: {
    "zh-CN": zhCN,
    "en-US": enUS,
  },
})

app.use(pinia).use(i18n).mount("#app")
