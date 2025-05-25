<template>
  <n-config-provider
    :theme-overrides="themeOverrides"
    :theme="themeStore.theme === 'dark' ? darkTheme : lightTheme"
    class="h-full"
    abstract
  >
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-message-provider>
          <n-modal-provider>
            <layout />
          </n-modal-provider>
        </n-message-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { useThemeStore } from "@/store/theme.ts"
import syncManager from "@/sync/syncManager.ts"
import { GlobalThemeOverrides, darkTheme, lightTheme } from "naive-ui"
import { useRefresh } from "@/hooks/useRresh"
const themeStore = useThemeStore()
import { SYNC_TYPE, SYNC_GIST_TOKEN, SYNC_GIST_ID } from "@/utils/constants.ts"
import { debounce } from "lodash-es"
import layout from "@/layout/index.vue"
import { useLanguageStore } from "@/store/language"
import { useI18n } from "vue-i18n"

const { locale } = useI18n()
const { refreshSpaces, refreshCollections } = useRefresh()

const loading = ref(true)

provide("loading", {
  loading,
  setLoading: (value: boolean) => {
    loading.value = value
  },
})
const languageStore = useLanguageStore()
watchEffect(() => {
  locale.value = languageStore.language
})

const handleVisibilityChange = debounce(
  async () => {
    const spaceId = localStorage.getItem("refreshCollections")
    if (spaceId) {
      await refreshCollections(Number(spaceId))
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
  common: {},
  Button: {
    waveOpacity: 0,
    borderRadiusSmall: "6px",
    borderRadiusMedium: "6px",
  },
  Dialog: {
    borderRadius: "12px",
  },
  Input: {
    boxShadowFocus: "none",
    borderRadius: "6px",
  },
  Radio: {
    buttonBorderRadius: "6px",
  },
  Popover: {
    borderRadius: "12px",
  },
  Dropdown: {
    borderRadius: "12px",
  },
  Card: {
    borderRadius: "12px",
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
