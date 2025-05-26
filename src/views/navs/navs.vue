<template>
  <div
    class="group/nav flex h-[50px] items-center justify-between pl-4 pr-6 [&_.n\-base\-selection\-input]:!pl-1 [&_.n\-base\-selection\-input]:!pr-1"
  >
    <div class="flex shrink-0 flex-nowrap items-center gap-3">
      <PinIcon
        side="left"
        :mode="layoutStore.leftLayoutMode"
        placement="bottom-start"
        :options="['collapse', 'expand', 'hover']"
        @update:mode="onChangeLayoutMode($event, 'left')"
      />
      <template v-if="title">
        <div
          class="flex shrink-0 flex-nowrap items-center gap-4 rounded px-2.5"
        >
          <div class="flex-center">
            <n-icon size="18" class="mr-2 text-text-primary">
              <component :is="ICON_LIST[icon ?? 'StorefrontOutline']" />
            </n-icon>
            <span class="shrink-0 select-none text-lg text-text-primary">
              {{ title }}
            </span>
          </div>
          <span class="h-[16px] w-[0.5px] bg-text-primary" />
          <span class="whitespace-nowrap font-thin text-text-secondary">
            {{ spacesStore.collections.length }} Collections
          </span>
        </div>
        <PopoverWrapper :message="ft('edit', 'space')" placement="bottom-start">
          <n-button
            tertiary
            :focusable="false"
            size="small"
            class="w-[28px]"
            @click="onEditSpace"
          >
            <template #icon>
              <n-icon size="18" :component="Edit" />
            </template>
          </n-button>
        </PopoverWrapper>
      </template>
    </div>
    <div class="flex-center gap-x-3">
      <SearchBtn />
      <MorePopover />
      <AddCollection />
      <TagFilter />
      <CollapseBtn />
      <PinIcon
        side="right"
        :mode="layoutStore.rightLayoutMode"
        placement="bottom-end"
        :options="['hover', 'expand', 'collapse']"
        @update:mode="onChangeLayoutMode($event, 'right')"
      />
    </div>
  </div>
  <TopDuplicateAction />
</template>

<script setup lang="tsx">
import { useRefresh } from "@/hooks/useRresh.ts"
import { useSpacesStore } from "@/store/spaces.ts"
import MorePopover from "@/views/navs/components/morePopover.vue"
import TagFilter from "@/views/navs/components/tag-filter.vue"
import { Edit, Delete } from "@vicons/carbon"
import dataManager from "@/db"
import IconSelect from "@components/icon-select.vue"
import { ICON_LIST } from "@/utils/constants.ts"
import { useEditDialog } from "@/hooks/useEditDialog.tsx"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"
import TopDuplicateAction from "@/views/navs/components/top-duplicate-action.vue"
import CollapseBtn from "@/views/navs/components/collapse-btn.vue"
import AddCollection from "@/views/navs/components/add-collection.vue"
import PopoverWrapper from "@/components/popover-wrapper.vue"
import SearchBtn from "@/views/navs/components/search-btn.vue"
import PinIcon from "@/components/pin-icon.vue"
import { useLayoutStore } from "@/store/layout"
import type { layoutMode } from "@/type"

const layoutStore = useLayoutStore()
const spacesStore = useSpacesStore()
const { open } = useEditDialog()
const { open: deleteDialog } = useDeleteDialog()
const dialog = useDialog()
const { ft, gt } = useHelpi18n()
const { refreshSpaces } = useRefresh()

const title = computed(
  () =>
    spacesStore.spaces.find((item) => item.id === spacesStore.activeId)?.title,
)

const icon = computed(
  () =>
    spacesStore.spaces.find((item) => item.id === spacesStore.activeId)?.icon,
)

function onEditSpace() {
  const formModel = ref({ title: title.value, icon: icon.value })
  open({
    title: ft("edit", "space"),
    renderContent: () => (
      <n-form model={formModel.value}>
        <n-form-item class="!text-text-primary">
          <n-input-group>
            <IconSelect v-model:value={formModel.value.icon} />
            <n-input v-model:value={formModel.value.title} />
            <n-button
              ghost
              type="error"
              onClick={() => onDeleteSpace()}
              v-slots={{
                icon: () => <n-icon size="16" component={Delete} />,
              }}
            />
          </n-input-group>
        </n-form-item>
      </n-form>
    ),
    onPositiveClick: async () => {
      if (!formModel.value.title) return
      await dataManager.updateSpaceTitle(
        spacesStore.activeId,
        formModel.value.title,
        formModel.value.icon,
      )
      await spacesStore.fetchSpaces()
    },
  })
}

function onDeleteSpace() {
  deleteDialog({
    title: ft("delete", "space"),
    content: () => (
      <span
        class="text-text-primary"
        v-html={gt("delete-confirm", title.value || "")}
      />
    ),
    onPositiveClick: async () => {
      await dataManager.removeSpace(spacesStore.activeId)
      await refreshSpaces()
      dialog.destroyAll()
    },
  })
}

function onChangeLayoutMode(mode: layoutMode, side: "left" | "right") {
  console.log("onChangeLayoutMode", mode, side)
  layoutStore.onUpdateLayoutMode(mode, side)
}
</script>
