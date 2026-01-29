<template>
  <n-float-button-group
    v-if="remainingText"
    :right="16"
    :bottom="16"
    class="!z-[9999]"
  >
    <n-tooltip
      placement="left"
      :show-arrow="false"
      to="body"
      :disabled="uploading"
    >
      <template #trigger>
        <div class="relative">
          <span
            v-if="uploading"
            class="absolute inset-0 h-10 w-10 animate-glow-pulse rounded-full border-2 border-primary"
          ></span>
          <n-float-button :loading="uploading" @click="handleUpload">
            <n-icon
              :component="HourglassOutline"
              size="18"
              class="animate-flip"
            />
          </n-float-button>
        </div>
      </template>
      <span class="text-xs">{{ remainingText }}后上传，点击立即上传</span>
    </n-tooltip>
  </n-float-button-group>
</template>

<script setup lang="ts">
import { HourglassOutline } from "@vicons/ionicons5"
import { useSettingStore } from "@/store/setting"
import syncManager from "@/sync/syncManager"
import { SYNC_GIST_TOKEN, SYNC_GIST_ID } from "@/utils/constants"

const settingStore = useSettingStore()

const remainingMs = ref<number | null>(null)
const uploading = ref(false)

const handleUpload = async () => {
  uploading.value = true
  try {
    await syncManager.uploadImmediate()
    remainingMs.value = null
  } finally {
    uploading.value = false
  }
}

const getModifiedTablesSize = () => {
  const stored = localStorage.getItem("modifiedTables")
  return stored ? JSON.parse(stored).length : 0
}

const hasSyncConfig = () => {
  const accessToken = localStorage.getItem(SYNC_GIST_TOKEN)
  const gistId = localStorage.getItem(SYNC_GIST_ID)
  return !!(accessToken && gistId)
}

const updateRemainingTime = () => {
  if (!hasSyncConfig()) {
    remainingMs.value = null
    return
  }

  if (getModifiedTablesSize() === 0) {
    remainingMs.value = null
    return
  }

  const lastModifiedTime = localStorage.getItem("lastModifiedTime")
  if (!lastModifiedTime) {
    remainingMs.value = null
    return
  }

  const syncInterval =
    settingStore.getSetting("saveAfterOperationTime") * 60 * 1000
  const elapsed = Date.now() - Number(lastModifiedTime)
  const remaining = syncInterval - elapsed

  remainingMs.value = remaining > 0 ? remaining : 0
}

const remainingText = computed(() => {
  if (remainingMs.value === null) return null
  const seconds = Math.ceil(remainingMs.value / 1000)
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return min > 0 ? `${min}分${sec}秒` : `${sec}秒`
})

let timer: ReturnType<typeof setInterval>
onMounted(() => {
  updateRemainingTime()
  timer = setInterval(updateRemainingTime, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>
