<template>
  <div class="space-y-4">
    <div
      class="rounded-lg border border-border-color bg-setting-card-color px-4 py-3"
    >
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-sm font-medium text-text-primary">
          {{ ft("data-rollback") }}
        </h3>
        <div class="flex gap-2">
          <n-button
            v-if="versions.length > 0"
            size="small"
            :loading="loading"
            :disabled="!hasGistConfig || isGitee"
            @click="handleGetData"
          >
            <template #icon>
              <n-icon :component="Renew" />
            </template>
          </n-button>
          <n-button
            v-else
            type="primary"
            size="small"
            :loading="loading"
            :disabled="!hasGistConfig || isGitee"
            @click="handleGetData"
          >
            {{ ft("get-data") }}
          </n-button>
        </div>
      </div>

      <div v-if="!hasGistConfig" class="text-xs text-text-secondary">
        {{ ft("config-gist-sync") }}
      </div>

      <div v-else-if="isGitee" class="text-xs text-text-secondary">
        {{ ft("gitee-no-version-support") }}
      </div>

      <div v-else-if="loading" class="py-4 text-center">
        <n-spin size="small" />
        <p class="mt-2 text-xs text-text-secondary">
          {{ ft("loading-versions") }}
        </p>
      </div>

      <div v-else-if="versions.length === 0" class="py-4">
        <n-empty
          size="small"
          :description="ft('no-versions')"
          class="text-text-secondary"
        />
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="(version, index) in versions"
          :key="version.version"
          class="flex items-center justify-between rounded-md border border-border-color p-3 hover:bg-hover-color"
        >
          <div class="flex-1">
            <div class="flex flex-col">
              <span class="text-xs font-medium text-text-primary">
                {{ ft("version-time") }}: {{ formatDate(version.committedAt) }}
              </span>
            </div>
            <div class="mt-1 flex items-center justify-between">
              <span class="text-xs text-text-primary">
                {{ version.version.substring(0, 8) }}
              </span>
              <n-tag v-if="index === 0" size="small" type="success">
                {{ ft("current-version") }}
              </n-tag>
              <n-button
                v-if="index > 0"
                size="tiny"
                type="primary"
                ghost
                :loading="rollbackLoading === version.version"
                @click="handleRollback(version)"
              >
                {{ ft("rollback-to-version") }}
              </n-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { SYNC_GIST_TOKEN, SYNC_GIST_ID, SYNC_TYPE } from "@/utils/constants.ts"
import { GistVersion } from "@/type.ts"
import GistManager from "@/sync/gistManager.ts"
import dataManager from "@/db/index.ts"
import { useMessage } from "naive-ui"
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"
import { useRefresh } from "@/hooks/useRresh.ts"
import dayjs from "dayjs"
import { Renew } from "@vicons/carbon"

const { ft } = useHelpi18n()
const message = useMessage()
const { open } = useDeleteDialog()
const { refreshSpaces, refreshCollections, updateContextMenus } = useRefresh()

const CACHE_EXPIRE_TIME = 5 * 60 * 1000 // 5分钟过期

const hasGistConfig = computed(() => {
  const accessToken = localStorage.getItem(SYNC_GIST_TOKEN)
  const gistId = localStorage.getItem(SYNC_GIST_ID)
  return !!(accessToken && gistId)
})

const isGitee = computed(() => {
  return localStorage.getItem(SYNC_TYPE) === "gitee"
})

const cacheKey = computed(() => {
  const gistId = localStorage.getItem(SYNC_GIST_ID) || "default"
  const syncType = localStorage.getItem(SYNC_TYPE) || "github"
  return `gist_versions_cache_${syncType}_${gistId}`
})

const loading = ref(false)
const rollbackLoading = ref("")
const versions = ref<GistVersion[]>([])

const formatDate = (date: string) => {
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss")
}

// 从缓存加载版本列表
const loadFromCache = () => {
  try {
    const cached = localStorage.getItem(cacheKey.value)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      // 检查缓存是否过期
      if (Date.now() - timestamp < CACHE_EXPIRE_TIME) {
        versions.value = data
        return true
      } else {
        // 缓存过期，清除
        localStorage.removeItem(cacheKey.value)
      }
    }
  } catch (error) {
    console.error("Failed to load cache:", error)
    // 清除损坏的缓存
    localStorage.removeItem(cacheKey.value)
  }
  return false
}

// 保存到缓存
const saveToCache = (data: GistVersion[]) => {
  try {
    localStorage.setItem(
      cacheKey.value,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    )
  } catch (error) {
    console.error("Failed to save cache:", error)
  }
}

const handleGetData = async () => {
  if (!hasGistConfig.value || isGitee.value) return

  try {
    loading.value = true
    versions.value = await GistManager.fetchGistVersions()
    if (versions.value.length === 0) {
      message.warning(ft("no-versions"))
    } else {
      // 保存到缓存
      saveToCache(versions.value)
    }
  } catch (error) {
    console.error("Failed to fetch versions:", error)
    message.error(ft("fetch-versions-failed"))
  } finally {
    loading.value = false
  }
}

// 组件加载时尝试从缓存加载
onMounted(() => {
  if (hasGistConfig.value && !isGitee.value) {
    loadFromCache()
  }
})

// 监听配置变化
watch([hasGistConfig, isGitee, cacheKey], ([hasConfig, gitee]) => {
  if (!hasConfig || gitee) {
    versions.value = []
  } else {
    loadFromCache()
  }
})

const handleRollback = (version: GistVersion) => {
  open({
    title: ft("tips-title"),
    content: ft("rollback-confirm"),
    onPositiveClick: async () => {
      try {
        rollbackLoading.value = version.version
        const data = await GistManager.fetchGistByVersion(version.version)
        await dataManager.importData(data)
        await refreshSpaces()
        await refreshCollections()
        await updateContextMenus()
        message.success(ft("rollback-success"))
      } catch (error) {
        console.error("Failed to rollback:", error)
        message.error(ft("rollback-failed"))
      } finally {
        rollbackLoading.value = ""
      }
    },
  })
}
</script>
