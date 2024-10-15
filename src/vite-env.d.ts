/// <reference types="vite/client" />
/// <reference types="@types/chrome/index" />

declare module "*.vue" {
  import { DefineComponent } from "vue"
  const component: DefineComponent<{}, {}, any>
  export default component
}
