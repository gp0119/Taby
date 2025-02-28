<template>
  <n-scrollbar class="max-h-[calc(100vh-50px)]">
    <n-collapse
      class="collections-wrapper bg-border-color"
      :expanded-names="defaultExpandNames"
      @update-expanded-names="onUpdateExpandNames"
    >
      <Collection
        class="collection-item !mb-[1px]"
        :collection="collection"
        v-for="collection in collections"
        :key="collection.id"
      />
    </n-collapse>
  </n-scrollbar>
</template>

<script setup lang="ts">
import { useRefresh } from "@/hooks/useRresh.ts"
import { useSpacesStore } from "@/store/spaces.ts"
import { useTagsStore } from "@/store/tags.ts"
import Collection from "@/views/content/components/collection.vue"
import { useLocalStorage } from "@vueuse/core"
import Sortable from "sortablejs"
import DataManager from "@/db"

const spacesStore = useSpacesStore()
const tagsStore = useTagsStore()
const dataManager = new DataManager()
const { refreshCollections } = useRefresh()

const collections = computed(() => {
  if (!tagsStore.selectedTagId) return spacesStore.collections
  return spacesStore.collections.filter((item) =>
    item.labelIds.includes(tagsStore.selectedTagId!),
  )
})

const defaultExpandNames = useLocalStorage<number[]>(
  "collectionsExpandNames",
  [],
)
watchEffect(() => {
  defaultExpandNames.value = spacesStore.collections.map((item) => item.id)
})

const onUpdateExpandNames = (value: number[]) => {
  defaultExpandNames.value = value
}

const createCollectionDragable = () => {
  const collectionDragArea = document.querySelector(
    ".collections-wrapper",
  ) as HTMLDivElement
  Sortable.create(collectionDragArea, {
    group: {
      name: "collections",
      put: ["nested-parent"],
    },
    animation: 150,
    ghostClass: "sortable-ghost-dashed-border",
    handle: ".collection-item",
    filter: ".no-drag",
    onEnd: async function (evt) {
      const { newIndex, oldIndex } = evt
      let collectionId: number, targetCollectionId: number
      collections.value?.forEach((item, index) => {
        if (index === oldIndex) collectionId = item.id
        if (index === newIndex) targetCollectionId = item.id
      })
      await dataManager.moveCollection(collectionId!, targetCollectionId!)
      await refreshCollections()
    },
  })
}

onMounted(() => {
  createCollectionDragable()
})
</script>
<style scoped>
.n-collapse :deep(.n-collapse-item) {
  border: none;
}
</style>
