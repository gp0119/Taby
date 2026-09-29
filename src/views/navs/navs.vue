<template>
  <div
    class="taby-nav group/nav flex h-[50px] items-center justify-between pl-4 pr-6 [&_.n\-base\-selection\-input]:!pl-1 [&_.n\-base\-selection\-input]:!pr-1"
  >
    <div
      class="taby-nav-left flex min-w-0 shrink-0 flex-nowrap items-center gap-3"
    >
      <n-button
        quaternary
        size="small"
        class="mobile-menu-button w-[28px]"
        aria-label="Open spaces menu"
        @click="emit('open-mobile-aside')"
      >
        <template #icon>
          <n-icon size="24" :component="Menu" />
        </template>
      </n-button>
      <div class="desktop-pin-icon">
        <PinIcon
          side="left"
          :mode="layoutStore.leftLayoutMode"
          placement="bottom-start"
          :options="['collapse', 'expand', 'hover']"
          @update:mode="onChangeLayoutMode($event, 'left')"
        />
      </div>
      <template v-if="title">
        <div
          class="nav-space-meta flex shrink-0 flex-nowrap items-center gap-4"
        >
          <div v-if="isEditing" ref="editRef" class="flex items-center gap-x-2">
            <DeletePopconfirm
              :name="title"
              :confirm="onDeleteSpace"
              placement="bottom-start"
            >
              <n-button
                size="small"
                quaternary
                type="error"
                class="mr-2 w-[28px] shrink-0"
                :title="ft('delete', 'space')"
                :aria-label="ft('delete', 'space')"
              >
                <template #icon>
                  <n-icon size="18" :component="TrashOutline" />
                </template>
              </n-button>
            </DeletePopconfirm>
            <n-input-group class="!w-[260px]">
              <IconSelect v-model:value="editingIcon" size="small" />
              <n-input
                ref="titleInputRef"
                v-model:value="editingTitle"
                size="small"
                :placeholder="ft('placeholder', 'title')"
                @keydown.enter="!$event.isComposing && onSaveSpace()"
                @keyup.esc="isEditing = false"
              />
            </n-input-group>
            <n-button size="small" @click="isEditing = false">
              {{ ft("cancel") }}
            </n-button>
            <n-button
              size="small"
              type="primary"
              :disabled="!editingTitle.trim()"
              @click="onSaveSpace"
            >
              {{ ft("save") }}
            </n-button>
          </div>
          <div v-else class="nav-space-title-wrapper flex-center">
            <n-icon size="18" class="nav-space-icon mr-2 text-text-primary">
              <component :is="ICON_LIST[icon ?? 'StorefrontOutline']" />
            </n-icon>
            <span
              class="nav-space-title shrink-0 select-none text-lg text-text-primary"
              :class="{ 'cursor-text': !isMobileWeb }"
              @click="onStartEdit"
            >
              {{ title }}
            </span>
          </div>
          <template v-if="!isEditing">
            <span
              class="nav-space-detail h-[16px] w-[0.5px] bg-text-secondary"
            />
            <span
              class="nav-space-detail whitespace-nowrap font-thin text-text-secondary"
            >
              {{ spacesStore.collections.length }} Collections
            </span>
          </template>
        </div>
      </template>
      <template v-if="!isEditing">
        <TagFilter />
        <CollapseBtn />
        <div class="mobile-manage-action">
          <LeftMoreAction />
        </div>
      </template>
    </div>
    <div class="taby-nav-right flex-center shrink-0 gap-x-3">
      <div class="mobile-manage-action">
        <AddCollection />
      </div>
      <SearchBtn />
      <MorePopover />
      <PinIcon
        v-if="!isWeb"
        side="right"
        :mode="layoutStore.rightLayoutMode"
        placement="bottom-end"
        :options="['hover', 'expand', 'collapse']"
        @update:mode="onChangeLayoutMode($event, 'right')"
      />
    </div>
  </div>
  <TopDuplicateAction />
  <TopDragableAction />
</template>

<script setup lang="ts">
import { useSpacesStore } from "@/store/spaces.ts"
import MorePopover from "@/views/navs/components/more-popover.vue"
import TagFilter from "@/views/navs/components/tag-filter.vue"
import { ICON_LIST } from "@/utils/constants.ts"
import TopDuplicateAction from "@/views/navs/components/top-duplicate-action.vue"
import CollapseBtn from "@/views/navs/components/collapse-btn.vue"
import AddCollection from "@/views/navs/components/add-collection.vue"
import SearchBtn from "@/views/navs/components/search-btn.vue"
import PinIcon from "@/components/pin-icon.vue"
import { useLayoutStore } from "@/store/layout"
import type { layoutMode } from "@/type"
import TopDragableAction from "@/views/navs/components/top-dragable-action.vue"
import LeftMoreAction from "@/views/navs/components/left-more-action.vue"
import IconSelect from "@components/icon-select.vue"
import { isWeb } from "@/utils/platform"
import { Menu, TrashOutline } from "@vicons/ionicons5"
import type { InputInst } from "naive-ui"
import { onClickOutside, useMediaQuery } from "@vueuse/core"
import dataManager from "@/db"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import DeletePopconfirm from "@/components/delete-popconfirm.vue"
import { useRefresh } from "@/hooks/useRresh.ts"

const layoutStore = useLayoutStore()
const spacesStore = useSpacesStore()
const { ft } = useHelpi18n()
const { updateContextMenus } = useRefresh()
const mobileLayoutQuery = useMediaQuery("(max-width: 999px)")
const isMobileWeb = computed(() => isWeb && mobileLayoutQuery.value)
const emit = defineEmits<{
  (e: "open-mobile-aside"): void
}>()

const title = computed(
  () =>
    spacesStore.spaces.find((item) => item.id === spacesStore.activeId)?.title,
)

const icon = computed(
  () =>
    spacesStore.spaces.find((item) => item.id === spacesStore.activeId)?.icon,
)

const isEditing = ref(false)
const editingTitle = ref("")
const editingIcon = ref("")
const titleInputRef = ref<InputInst>()
const editRef = ref<HTMLElement>()

onClickOutside(editRef, () => (isEditing.value = false), {
  ignore: [".n-modal-container", ".n-popconfirm"],
})

watch(
  () => spacesStore.activeId,
  () => (isEditing.value = false),
)

function onStartEdit() {
  if (isMobileWeb.value) return
  editingTitle.value = title.value!
  editingIcon.value = icon.value ?? "StorefrontOutline"
  isEditing.value = true
  nextTick(() => {
    titleInputRef.value?.focus()
    titleInputRef.value?.select()
  })
}

async function onSaveSpace() {
  const newTitle = editingTitle.value.trim()
  if (!newTitle) return
  isEditing.value = false
  if (newTitle === title.value && editingIcon.value === icon.value) return
  await dataManager.updateSpaceTitle(
    spacesStore.activeId,
    newTitle,
    editingIcon.value,
  )
  await updateContextMenus()
}

async function onDeleteSpace() {
  await dataManager.removeSpace(spacesStore.activeId)
  isEditing.value = false
  await updateContextMenus()
}

function onChangeLayoutMode(mode: layoutMode, side: "left" | "right") {
  layoutStore.onUpdateLayoutMode(mode, side)
}
</script>
