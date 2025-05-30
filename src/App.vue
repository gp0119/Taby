<template>
  <n-config-provider
    :theme-overrides="themeOverrides"
    :theme="theme === 'dark' ? darkTheme : lightTheme"
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
import syncManager from "@/sync/syncManager.ts"
import { darkTheme, lightTheme } from "naive-ui"
import { useRefresh } from "@/hooks/useRresh"
import { SYNC_TYPE, SYNC_GIST_TOKEN, SYNC_GIST_ID } from "@/utils/constants.ts"
import { debounce } from "lodash-es"
import layout from "@/layout/index.vue"
import { useTheme } from "@/hooks/useTheme"

const { refreshSpaces, refreshCollections } = useRefresh()
const { themeOverrides, theme } = useTheme()

const loading = ref(true)

provide("loading", {
  loading,
  setLoading: (value: boolean) => {
    loading.value = value
  },
})

const handleVisibilityChange = debounce(
  async () => {
    await syncManager.autoUpload()
  },
  3000,
  { leading: true, trailing: false },
)

const handleMessage = async (message: any) => {
  if (message.type === "refreshCollections") {
    await refreshSpaces()
    await refreshCollections(Number(message.spaceId))
  }
}

onMounted(() => {
  document.addEventListener("visibilitychange", handleVisibilityChange)
  window.addEventListener("beforeunload", removeListener)
  chrome.runtime.onMessage.addListener(handleMessage)
})

onUnmounted(() => {
  removeListener()
  chrome.runtime.onMessage.removeListener(handleMessage)
})

const removeListener = () => {
  document.removeEventListener("visibilitychange", handleVisibilityChange)
  window.removeEventListener("beforeunload", removeListener)
  chrome.runtime.onMessage.removeListener(handleMessage)
}

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
