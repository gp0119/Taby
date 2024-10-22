import { createApp } from "vue"
import "./style.css"
import App from "./App.vue"
import { createPinia } from "pinia"
import tabbyDatabaseService from "@/db"

await tabbyDatabaseService.initDb()
const pinia = createPinia()
const app = createApp(App)
app.use(pinia).mount("#app")
