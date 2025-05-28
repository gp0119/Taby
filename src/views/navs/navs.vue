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
          <span class="h-[16px] w-[0.5px] bg-text-secondary" />
          <span class="whitespace-nowrap font-thin text-text-secondary">
            {{ spacesStore.collections.length }} Collections
          </span>
        </div>
      </template>
      <EditSpace :title="title!" :icon="icon!" />
      <TagFilter />
      <CollapseBtn />
      <LeftMoreAction />
    </div>
    <div class="flex-center gap-x-3">
      <AddCollection />
      <SearchBtn />
      <MorePopover />
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
  <TopDragableAction />
</template>

<script setup lang="tsx">
import { useSpacesStore } from "@/store/spaces.ts"
import MorePopover from "@/views/navs/components/morePopover.vue"
import TagFilter from "@/views/navs/components/tag-filter.vue"
import { ICON_LIST } from "@/utils/constants.ts"
import TopDuplicateAction from "@/views/navs/components/top-duplicate-action.vue"
import CollapseBtn from "@/views/navs/components/collapse-btn.vue"
import AddCollection from "@/views/navs/components/add-collection.vue"
import SearchBtn from "@/views/navs/components/search-btn.vue"
import PinIcon from "@/components/pin-icon.vue"
import { useLayoutStore } from "@/store/layout"
import type { layoutMode } from "@/type"
import EditSpace from "@/views/navs/components/edit-space.vue"
import TopDragableAction from "@/views/navs/components/top-dragable-action.vue"
import LeftMoreAction from "@/views/navs/components/left-more-action.vue"

const layoutStore = useLayoutStore()
const spacesStore = useSpacesStore()

const title = computed(
  () =>
    spacesStore.spaces.find((item) => item.id === spacesStore.activeId)?.title,
)

const icon = computed(
  () =>
    spacesStore.spaces.find((item) => item.id === spacesStore.activeId)?.icon,
)

function onChangeLayoutMode(mode: layoutMode, side: "left" | "right") {
  console.log("onChangeLayoutMode", mode, side)
  layoutStore.onUpdateLayoutMode(mode, side)
}
</script>
