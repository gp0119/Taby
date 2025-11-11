<template>
  <div>
    <div
      v-if="!isHasRight"
      class="relative flex w-full flex-col justify-center gap-y-4 bg-white p-4"
    >
      <n-skeleton height="20px" class="opacity-30" />
      <n-skeleton height="20px" class="opacity-30" />
      <n-skeleton height="20px" class="opacity-30" />
      <n-button
        type="primary"
        class="absolute right-1/2 top-1/2 z-10 -translate-y-1/2 translate-x-1/2"
        @click="onGrantAccess"
      >
        {{ ft("grant access") }}
      </n-button>
    </div>
    <div v-else class="flex flex-col gap-2">
      <div
        v-for="folder in bookmarkFolders"
        :key="folder.id"
        class="flex items-center justify-between rounded-md border border-gray-200 p-3 hover:bg-gray-50"
      >
        <div class="flex-1">
          <div class="font-medium">{{ folder.title }}</div>
          <div class="text-sm text-gray-500">
            {{ folder.children?.length || 0 }} {{ ft("card") }}
          </div>
        </div>
        <n-button
          size="small"
          type="primary"
          :loading="importingId === folder.id"
          @click="importFolder(folder)"
        >
          {{ ft("import") }}
        </n-button>
      </div>
      <div
        v-if="bookmarkFolders.length === 0"
        class="text-center text-gray-400"
      >
        {{ ft("no-collections") }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dataManager from "@/db"
import { useSpacesStore } from "@/store/spaces"
import { useRefresh } from "@/hooks/useRresh"
import { useHelpi18n } from "@/hooks/useHelpi18n"

const isHasRight = ref(false)
const bookmarksTree = ref<chrome.bookmarks.BookmarkTreeNode[]>([])
const importingId = ref<string | null>(null)
const isImporting = ref(false)
const spacesStore = useSpacesStore()
const { refreshCollections } = useRefresh()
const { ft } = useHelpi18n()

const bookmarkFolders = computed(() => {
  const folders: chrome.bookmarks.BookmarkTreeNode[] = []
  const collectFolders = (nodes: chrome.bookmarks.BookmarkTreeNode[]) => {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        const bookmarks = node.children.filter((child) => child.url)
        if (bookmarks.length > 0) {
          folders.push({
            ...node,
            children: bookmarks,
          })
        }
        collectFolders(node.children)
      }
    }
  }
  collectFolders(bookmarksTree.value)
  return folders
})

async function onGrantAccess() {
  chrome.permissions.request({ permissions: ["bookmarks"] }, (granted) => {
    if (granted) {
      isHasRight.value = true
      chrome.bookmarks.getTree((tree) => {
        if (tree?.length > 0) {
          bookmarksTree.value = tree[0].children || []
        }
      })
    }
  })
}

async function importFolder(folder: chrome.bookmarks.BookmarkTreeNode) {
  if (!folder.children || folder.children.length === 0) return
  if (isImporting.value) return
  isImporting.value = true
  importingId.value = folder.id
  try {
    const spaceId = spacesStore.activeId

    const collectionId = await dataManager.addCollection({
      title: folder.title,
      spaceId,
      labelIds: [],
    })

    const bookmarks = folder.children.filter((child) => child.url)
    for (const bookmark of bookmarks) {
      await dataManager.addCard({
        title: bookmark.title || "",
        url: bookmark.url || "",
        description: "",
        collectionId: collectionId!,
      })
    }
    await refreshCollections()
  } catch (error) {
    console.error("Import bookmarks failed:", error)
  } finally {
    importingId.value = null
    isImporting.value = false
  }
}

onMounted(() => {
  chrome.permissions.contains({ permissions: ["bookmarks"] }, (result) => {
    if (result) {
      isHasRight.value = true
      chrome.bookmarks.getTree((tree) => {
        if (tree?.length > 0) {
          bookmarksTree.value = tree[0].children || []
        }
      })
    }
  })
})
</script>
