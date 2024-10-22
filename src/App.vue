<template>
  <Suspense>
    <n-config-provider :theme-overrides="themeOverrides" class="h-full">
      <n-dialog-provider>
        <n-layout has-sider class="h-full" content-class="bg-[#fafafa]">
          <n-layout-sider
            bordered
            :width="200"
            :collapsed-width="30"
            content-class="bg-[#fafafa]"
            :show-collapsed-content="false"
            show-trigger="arrow-circle"
          >
            <left-aside />
          </n-layout-sider>
          <n-layout
            content-class="bg-[#fafafa]"
            has-sider
            sider-placement="right"
          >
            <n-layout-content content-class="bg-[#fafafa]  overflow-hidden">
              <navs />
              <content />
            </n-layout-content>
            <n-layout-sider
              style="border-left: 1px solid rgb(239, 239, 245)"
              :width="250"
              :collapsed-width="30"
              :show-collapsed-content="false"
              show-trigger="arrow-circle"
            >
              <right-aside />
            </n-layout-sider>
          </n-layout>
        </n-layout>
      </n-dialog-provider>
    </n-config-provider>
    <template #fallback>
      <div>Loading...</div>
    </template>
  </Suspense>
</template>

<script setup lang="ts">
import navs from "./components/navs.vue"
import leftAside from "./components/left-aside.vue"
import rightAside from "./components/right-aside.vue"
import content from "./components/content.vue"
import { GlobalThemeOverrides } from "naive-ui"
const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: "#F65077",
    primaryColorHover: "#e54a6f",
  },
}
</script>
