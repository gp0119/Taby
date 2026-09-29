<template>
  <div class="flex h-full flex-col" v-bind="$attrs">
    <LogoWrapper @add-space="onStartAddSpace" />
    <div class="mt-2 w-full flex-1 overflow-y-auto px-2">
      <SpaceWrapper
        :spaces="allSpaces"
        :active-space-id="activeSpaceId"
        @click="onHandleSpaceClick"
        @drag-end="onDragEnd"
      />
      <div v-if="isCreating" ref="createRef" class="mt-1 px-2 py-1.5">
        <n-input-group>
          <IconSelect v-model:value="newIcon" size="small" />
          <n-input
            ref="titleInputRef"
            v-model:value="newTitle"
            size="small"
            :disabled="isSaving"
            :placeholder="ft('placeholder', 'title')"
            :aria-label="ft('title')"
            @keydown.enter="!$event.isComposing && onSaveSpace()"
            @keyup.esc="onCancelAddSpace"
          />
        </n-input-group>
        <div class="mt-2 flex justify-end gap-x-2">
          <n-button size="small" :disabled="isSaving" @click="onCancelAddSpace">
            {{ ft("cancel") }}
          </n-button>
          <n-button
            size="small"
            type="primary"
            :disabled="!newTitle.trim()"
            :loading="isSaving"
            @click="onSaveSpace"
          >
            {{ ft("save") }}
          </n-button>
        </div>
      </div>
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
import { useTagsStore } from "@/store/tags"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import IconSelect from "@/components/icon-select.vue"
import type { InputInst } from "naive-ui"
import { onClickOutside } from "@vueuse/core"

const spacesStore = useSpacesStore()
const { updateContextMenus } = useRefresh()
const duplicateCardStore = useDuplicateCardStore()
const tagsStore = useTagsStore()
const { ft } = useHelpi18n()
const isCreating = ref(false)
const isSaving = ref(false)
const newTitle = ref("")
const newIcon = ref("StorefrontOutline")
const createRef = ref<HTMLElement>()
const titleInputRef = ref<InputInst>()

onClickOutside(createRef, onCancelAddSpace, {
  ignore: [".n-popover"],
})

async function onStartAddSpace() {
  if (isSaving.value) return
  if (!isCreating.value) {
    newTitle.value = ""
    newIcon.value = "StorefrontOutline"
    isCreating.value = true
  }
  await nextTick()
  createRef.value?.scrollIntoView({ block: "nearest" })
  titleInputRef.value?.focus()
}

function onCancelAddSpace() {
  if (!isSaving.value) isCreating.value = false
}

async function onSaveSpace() {
  const title = newTitle.value.trim()
  if (!title || isSaving.value) return
  isSaving.value = true
  try {
    await dataManager.addSpace({ title, icon: newIcon.value })
    isCreating.value = false
    await updateContextMenus()
  } finally {
    isSaving.value = false
  }
}

const allSpaces = computed(() => spacesStore.spaces)
const activeSpaceId = computed(() => spacesStore.activeId)

const onDragEnd = async (evt: SortableEvent) => {
  const { item: itemEl, oldIndex, newIndex } = evt
  if (newIndex === oldIndex) return
  const currentSpaceId = itemEl.getAttribute("data-id")
  await dataManager.moveSpace(Number(currentSpaceId), oldIndex!, newIndex!)
  await updateContextMenus()
}

const { setLoading } = inject("loading") as {
  setLoading: (value: boolean) => void
}
async function onHandleSpaceClick(space: Space) {
  if (space.id === spacesStore.activeId) return
  setLoading(true)
  await spacesStore.setActiveSpace(space.id!)
  tagsStore.resetSelectedTag()
  duplicateCardStore.clearDuplicateCards()
  setLoading(false)
}
</script>
