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
            :disabled="!hasGistConfig || !isGithub"
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
            :disabled="!hasGistConfig || !isGithub"
            @click="handleGetData"
          >
            {{ ft("get-data") }}
          </n-button>
        </div>
      </div>

      <div v-if="!isGithub" class="text-xs text-text-secondary">
        {{ ft("sync-no-version-support") }}
      </div>

      <div v-else-if="!hasGistConfig" class="text-xs text-text-secondary">
        {{ ft("config-gist-sync") }}
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
import { GistVersion } from "@/type.ts"
import { createGistManager } from "@/sync/gistManager.ts"
import { getGistConfig, getSyncProviderType } from "@/sync/syncConfig.ts"
import type { GistConfig, SyncProviderType } from "@/sync/syncConfig.ts"
import dataManager from "@/db/index.ts"
import { useMessage } from "naive-ui"
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"
import { useRefresh } from "@/hooks/useRresh.ts"
import dayjs from "dayjs"
import { Renew } from "@vicons/carbon"
import { resetMainScrollPosition } from "@/utils/scrollPositionStorage"

const { ft } = useHelpi18n()
const message = useMessage()
const { open } = useDeleteDialog()
const { updateContextMenus } = useRefresh()

const CACHE_EXPIRE_TIME = 60 * 60 * 1000 // 1小时过期
const CACHE_KEY_PREFIX = "gist_versions_cache_"

// 同步配置存在 localStorage 里，不是响应式的，只能在挂载时读一次快照
const githubConfig = ref<GistConfig>({
  type: "github",
  accessToken: "",
  gistId: "",
})
const syncType = ref<SyncProviderType>("github")

onBeforeMount(() => {
  githubConfig.value = getGistConfig("github")
  syncType.value = getSyncProviderType()
})

const hasGistConfig = computed(() => {
  return !!(githubConfig.value.accessToken && githubConfig.value.gistId)
})

const isGithub = computed(() => {
  return syncType.value === "github"
})

const cacheKey = computed(() => {
  return `${CACHE_KEY_PREFIX}github_${githubConfig.value.gistId || "default"}`
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

// 清掉切换 gistId / 同步方式后遗留的缓存
const removeStaleCache = () => {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index)
    if (key?.startsWith(CACHE_KEY_PREFIX) && key !== cacheKey.value) {
      localStorage.removeItem(key)
    }
  }
}

// 保存到缓存
const saveToCache = (data: GistVersion[]) => {
  try {
    removeStaleCache()
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
  if (!hasGistConfig.value || !isGithub.value) return

  try {
    loading.value = true
    versions.value = await createGistManager(
      githubConfig.value,
    ).fetchGistVersions()
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

// 监听配置变化（首次读取配置也会走这里）
watch([hasGistConfig, isGithub, cacheKey], ([hasConfig, github]) => {
  if (!hasConfig || !github) {
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
        const data = await createGistManager(
          githubConfig.value,
        ).fetchGistByVersion(version.version)
        await dataManager.importData(data)
        resetMainScrollPosition()
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
