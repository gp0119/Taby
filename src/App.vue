<template>
  <n-config-provider :theme-overrides="themeOverrides" class="h-full" abstract>
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-message-provider>
          <n-modal-provider>
            <n-layout
              has-sider
              class="h-full [&_.n-layout-toggle-button]:!top-[25px] [&_.n-layout-toggle-button]:!bg-body-color [&_.n-layout-toggle-button]:shadow-base"
              content-class="bg-body-color"
            >
              <n-layout-sider
                :width="200"
                :collapsed-width="30"
                :collapsed="leftAsideCollapsed"
                :show-collapsed-content="false"
                show-trigger="arrow-circle"
                class="border-r !bg-body-color"
                @update:collapsed="onUpdateLeftAsideCollapsed"
              >
                <left-aside
                  :class="{ 'animate-fade-out': leftAsideCollapsed }"
                />
              </n-layout-sider>
              <n-layout
                content-class="bg-body-color"
                has-sider
                sider-placement="right"
              >
                <n-layout-content
                  content-class="bg-body-color  overflow-hidden"
                >
                  <navs />
                  <content />
                </n-layout-content>
                <n-layout-sider
                  class="border-l !bg-body-color"
                  :width="250"
                  :collapsed-width="30"
                  :collapsed="rightAsideCollapsed"
                  :show-collapsed-content="false"
                  show-trigger="arrow-circle"
                  @update:collapsed="onUpdateRightAsideCollapsed"
                >
                  <right-aside
                    :class="{ 'animate-fade-out': rightAsideCollapsed }"
                  />
                </n-layout-sider>
              </n-layout>
            </n-layout>
          </n-modal-provider>
        </n-message-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { useThemeStore } from "@/store/theme.ts"
import syncManager from "@/sync/syncManager.ts"
import navs from "@/views/navs/navs.vue"
import leftAside from "@/views/left-aside/left-aside.vue"
import rightAside from "@/views/right-aside/index.vue"
import content from "@/views/content/index.vue"
import { GlobalThemeOverrides } from "naive-ui"
import { useRefresh } from "@/hooks/useRresh"
const themeStore = useThemeStore()
import { SYNC_TYPE, SYNC_GIST_TOKEN, SYNC_GIST_ID } from "@/utils/constants.ts"
import { debounce } from "lodash-es"

const { refreshSpaces, refreshCollections } = useRefresh()

const loading = ref(true)

provide("loading", {
  loading,
  setLoading: (value: boolean) => {
    loading.value = value
  },
})

const leftAsideCollapsed = ref(false)
const rightAsideCollapsed = ref(false)
const onUpdateLeftAsideCollapsed = (collapsed: boolean) => {
  leftAsideCollapsed.value = collapsed
}
const onUpdateRightAsideCollapsed = (collapsed: boolean) => {
  rightAsideCollapsed.value = collapsed
}
const handleVisibilityChange = debounce(
  async () => {
    if (localStorage.getItem("refreshCollections")) {
      await refreshCollections()
      localStorage.removeItem("refreshCollections")
    }
    await syncManager.autoUpload()
  },
  3000,
  { leading: true, trailing: false },
)

onMounted(() => {
  document.addEventListener("visibilitychange", handleVisibilityChange)
  window.addEventListener("beforeunload", removeListener)
})

const removeListener = () => {
  document.removeEventListener("visibilitychange", handleVisibilityChange)
  window.removeEventListener("beforeunload", removeListener)
}

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
  Radio: {
    buttonColor: themeStore.themeColor[themeStore.theme].cardBackground,
    buttonTextColor: themeStore.themeColor[themeStore.theme].textPrimary,
    buttonColorActive: themeStore.themeColor[themeStore.theme].primary,
    buttonBorderColorActive: themeStore.themeColor[themeStore.theme].primary,
    buttonTextColorActive: "#fff",
  },
  Tag: {
    colorBordered: themeStore.themeColor[themeStore.theme].cardBackground,
    closeIconColor: themeStore.themeColor[themeStore.theme].textPrimary,
  },
  LoadingBar: {
    colorLoading: "#18A058",
  },
}))

onBeforeMount(async () => {
  const result = await chrome.storage.sync.get([
    SYNC_GIST_TOKEN,
    SYNC_GIST_ID,
    SYNC_TYPE,
  ])
  if (result.syncType) {
    localStorage.setItem("syncType", result.syncType)
  }
  if (result.accessToken) {
    localStorage.setItem("accessToken", result.accessToken)
  }
  if (result.gistId) {
    localStorage.setItem("gistId", result.gistId)
  }
})

onMounted(async () => {
  themeStore.applyThemeAttribute()
  await new Promise((resolve) => setTimeout(resolve, 100))
  await refreshSpaces()
  await refreshCollections()
  const isDownloaded = await syncManager.autoDownload()
  if (isDownloaded) {
    await refreshSpaces()
    await refreshCollections()
  }
  loading.value = false
})
</script>
