/// <reference types="vite/client" />
/// <reference types="@types/chrome/index" />

declare module "*.vue" {
  import { DefineComponent } from "vue"
  // Vue's SFC shim intentionally uses empty object defaults for component generics.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  const component: DefineComponent<{}, {}, any>
  export default component
}
