import { createApp } from "vue"
import "../style.css"
import App from "./app.vue"
import { createPinia } from "pinia"

const pinia = createPinia()

createApp(App).use(pinia).mount("#app")
