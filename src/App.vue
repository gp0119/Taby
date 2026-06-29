<template>
  <n-config-provider
    :theme-overrides="themeOverrides"
    :theme="theme === 'dark' ? darkTheme : lightTheme"
    class="h-full"
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

const { updateContextMenus } = useRefresh()
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
    // 先按照 5 分钟窗口尝试上传本地的脏数据；
    // 再触发一次 autoDownload —— 它内部只有"远端真的比本地新"时才打 API，
    // 廉价路径下只是读一次 chrome.storage.sync。
    await syncManager.autoUpload()
    await syncManager.autoDownload()
  },
  3000,
  { leading: true, trailing: false },
)

const removeListener = () => {
  document.removeEventListener("visibilitychange", handleVisibilityChange)
  window.removeEventListener("beforeunload", removeListener)
}

onBeforeMount(async () => {
  const result = await chrome.storage.sync.get([
    SYNC_GIST_TOKEN,
    SYNC_GIST_ID,
    SYNC_TYPE,
  ])
  if (result.syncType) {
    localStorage.setItem("syncType", String(result.syncType))
  }
  if (result.accessToken) {
    localStorage.setItem("accessToken", String(result.accessToken))
  }
  if (result.gistId) {
    localStorage.setItem("gistId", String(result.gistId))
  }
})

onMounted(async () => {
  // 远端覆盖本地后，store 由 liveQuery 更新；这里只同步 Chrome 原生菜单。
  syncManager.setOnRemoteImported(async () => {
    await updateContextMenus()
  })

  const isRecovered = await syncManager.waitForInit()
  document.addEventListener("visibilitychange", handleVisibilityChange)
  window.addEventListener("beforeunload", removeListener)

  // 初次渲染：store 由 liveQuery 订阅 IDB；这里只需要同步 Chrome 原生菜单。
  await updateContextMenus()

  // 启动时主动跑一次 visibility 流：上传脏数据 + 拉取远端更新（带冲突检测）。
  // 如果 isRecovered 说明刚从远端恢复，没必要再来一遍。
  if (!isRecovered) {
    handleVisibilityChange()
  }

  loading.value = false
})

onUnmounted(() => {
  removeListener()
  syncManager.setOnRemoteImported(undefined)
})
</script>
