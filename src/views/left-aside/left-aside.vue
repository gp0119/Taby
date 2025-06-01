<template>
  <div class="flex h-full flex-col" v-bind="$attrs">
    <LogoWrapper />
    <div class="mt-2 w-full flex-1 px-2">
      <SpaceWrapper
        :spaces="allSpaces"
        :active-space-id="activeSpaceId"
        @click="onHandleSpaceClick"
        @drag-end="onDragEnd"
      />
    </div>
  </div>
</template>

<script setup lang="tsx">
import { useSpacesStore } from "@/store/spaces.ts"
import { Space } from "@/type.ts"
import { useRefresh } from "@/hooks/useRresh.ts"
import SpaceWrapper from "./components/space-wrapper.vue"
import { SortableEvent } from "vue-draggable-plus"
import dataManager from "@/db"
import { useDuplicateCardStore } from "@/store/duplicate-card"
import LogoWrapper from "./components/logo-wrapper.vue"

const spacesStore = useSpacesStore()
const { refreshSpaces, refreshTags, updateContextMenus } = useRefresh()
const duplicateCardStore = useDuplicateCardStore()

const allSpaces = computed(() => spacesStore.spaces)
const activeSpaceId = computed(() => spacesStore.activeId)

const onDragEnd = async (evt: SortableEvent) => {
  const { item: itemEl, oldIndex, newIndex } = evt
  if (newIndex === oldIndex) return
  const currentSpaceId = itemEl.getAttribute("data-id")
  await dataManager.moveSpace(Number(currentSpaceId), oldIndex!, newIndex!)
  await refreshSpaces()
  await updateContextMenus()
}

const { setLoading } = inject("loading") as {
  setLoading: (value: boolean) => void
}
async function onHandleSpaceClick(space: Space) {
  if (space.id === spacesStore.activeId) return
  setLoading(true)
  await spacesStore.setActiveSpace(space.id!)
  await refreshTags()
  duplicateCardStore.clearDuplicateCards()
  setLoading(false)
}
</script>
