<template>
  <Suspense>
    <n-config-provider :theme-overrides="themeOverrides" class="h-full">
      <n-dialog-provider>
        <n-message-provider>
          <n-layout has-sider class="h-full" content-class="bg-body-color">
            <n-layout-sider
              :width="200"
              :collapsed-width="30"
              content-class="bg-body-color"
              :show-collapsed-content="false"
              show-trigger="arrow-circle"
              trigger-class="!bg-body-color"
              class="border-r"
            >
              <left-aside />
            </n-layout-sider>
            <n-layout
              content-class="bg-body-color"
              has-sider
              sider-placement="right"
            >
              <n-layout-content content-class="bg-body-color  overflow-hidden">
                <navs />
                <content />
              </n-layout-content>
              <n-layout-sider
                content-class="bg-body-color"
                class="border-l"
                :width="250"
                :collapsed-width="30"
                :show-collapsed-content="false"
                show-trigger="arrow-circle"
                trigger-class="!bg-body-color"
              >
                <right-aside />
              </n-layout-sider>
            </n-layout>
          </n-layout>
        </n-message-provider>
      </n-dialog-provider>
    </n-config-provider>
    <template #fallback>
      <div class="bg-primary">Loading...</div>
    </template>
  </Suspense>
</template>

<script setup lang="ts">
import { useSpacesStore } from "@/store/spaces.ts"
import { useThemeStore } from "@/store/theme.ts"
import { downloadAll } from "@/sync/gistSync.ts"
import navs from "./components/navs.vue"
import leftAside from "./components/left-aside.vue"
import rightAside from "./components/right-aside.vue"
import content from "./components/content.vue"
import { GlobalThemeOverrides } from "naive-ui"

const themeStore = useThemeStore()

themeStore.setThemeProperty()

const themeOverrides: ComputedRef<GlobalThemeOverrides> = computed(() => ({
  common: {
    primaryColor: themeStore.themeColor[themeStore.theme].primary,
    primaryColorHover: themeStore.themeColor[themeStore.theme].darkenPrimary,
    inputColor: themeStore.themeColor[themeStore.theme].cardBackground,
    popoverColor: themeStore.themeColor[themeStore.theme].cardBackground,
    hoverColor: themeStore.themeColor[themeStore.theme].hoverColor,
    textColor2: themeStore.themeColor[themeStore.theme].textPrimary,
  },
  Button: {
    textColor: themeStore.themeColor[themeStore.theme].textPrimary,
    colorPressedPrimary: themeStore.themeColor[themeStore.theme].darkenPrimary,
  },
  Input: {
    color: themeStore.themeColor[themeStore.theme].cardBackground,
    textColor: themeStore.themeColor[themeStore.theme].textPrimary,
  },
  Form: {
    labelTextColor: themeStore.themeColor[themeStore.theme].textPrimary,
  },
}))

const spacesStore = useSpacesStore()

const refresh = async () => {
  await spacesStore.fetchSpaces()
  await spacesStore.fetchCollections(spacesStore.activeId)
}

async function autoSync() {
  const result = await chrome.storage.sync.get(["accessToken", "gistId"])
  const { accessToken, gistId } = result
  if (!accessToken || !gistId) return
  const lastSyncTime = localStorage.getItem("lastSyncTime")
  if (!lastSyncTime) {
    await downloadAll(accessToken, gistId)
    await refresh()
    localStorage.setItem("lastSyncTime", Date.now() + "")
    return
  } else {
    const now = Date.now()
    if (now - Number(lastSyncTime) > 1000 * 60 * 60) {
      await downloadAll(accessToken, gistId)
      await refresh()
      localStorage.setItem("lastSyncTime", Date.now() + "")
    }
  }
}
autoSync()
</script>
