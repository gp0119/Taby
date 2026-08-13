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
          <div class="nav-space-title-wrapper flex-center">
            <n-icon size="18" class="nav-space-icon mr-2 text-text-primary">
              <component :is="ICON_LIST[icon ?? 'StorefrontOutline']" />
            </n-icon>
            <span
              class="nav-space-title shrink-0 select-none text-lg text-text-primary"
            >
              {{ title }}
            </span>
          </div>
          <span class="nav-space-detail h-[16px] w-[0.5px] bg-text-secondary" />
          <span
            class="nav-space-detail whitespace-nowrap font-thin text-text-secondary"
          >
            {{ spacesStore.collections.length }} Collections
          </span>
        </div>
      </template>
      <TagFilter />
      <CollapseBtn />
      <div class="mobile-manage-action">
        <LeftMoreAction />
      </div>
    </div>
    <div class="taby-nav-right flex-center shrink-0 gap-x-3">
      <div v-if="title" class="mobile-manage-action">
        <EditSpace :title="title!" :icon="icon!" />
      </div>
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

<script setup lang="tsx">
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
import EditSpace from "@/views/navs/components/edit-space.vue"
import TopDragableAction from "@/views/navs/components/top-dragable-action.vue"
import LeftMoreAction from "@/views/navs/components/left-more-action.vue"
import { isWeb } from "@/utils/platform"
import { Menu } from "@vicons/ionicons5"

const layoutStore = useLayoutStore()
const spacesStore = useSpacesStore()
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

function onChangeLayoutMode(mode: layoutMode, side: "left" | "right") {
  layoutStore.onUpdateLayoutMode(mode, side)
}
</script>
