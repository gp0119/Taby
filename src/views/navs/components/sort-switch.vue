<template>
  <n-popover
    trigger="hover"
    :show="sortStore.isSortOpen"
    placement="right-start"
    :show-arrow="false"
    class="!bg-dialog-color"
    style="padding: 0"
    @select="handleSortSelect"
    @update:show="sortStore.toggleSortOpen"
  >
    <template #trigger>
      <div
        class="flex w-full cursor-pointer items-center justify-between px-4 py-2 hover:bg-hover-color"
      >
        <div class="flex items-center gap-x-2">
          <n-button tertiary size="small" class="w-[28px]">
            <template
              v-if="
                sortStore.sortOrder === 'title-desc' ||
                sortStore.sortOrder === 'created-at-desc'
              "
              #icon
            >
              >
              <n-icon size="18" :component="ArrowUp" />
            </template>
            <template
              v-else-if="
                sortStore.sortOrder === 'title-asc' ||
                sortStore.sortOrder === 'created-at-asc'
              "
              #icon
            >
              <n-icon>
                <n-icon size="18" :component="ArrowDown" />
              </n-icon>
            </template>
            <template v-else #icon>
              <n-icon size="20" :component="Draggable" />
            </template>
          </n-button>
          <span>{{ ft(sortStore.sortOrder ?? "draggable") }}</span>
        </div>
        <n-icon
          size="20"
          class="text-text-primary"
          :component="ChevronForward"
        />
      </div>
    </template>
    <template #default>
      <div class="flex flex-col overflow-hidden rounded-lg bg-dialog-color">
        <div
          v-for="option in sortStore.sortOptions"
          :key="option.key"
          class="flex cursor-pointer select-none items-center gap-x-2 px-4 py-2 hover:bg-hover-color"
          @click="handleSortSelect(option.key)"
        >
          <n-icon
            v-if="
              option.key === 'title-desc' || option.key === 'created-at-desc'
            "
            :component="ArrowUp"
          />
          <n-icon
            v-else-if="
              option.key === 'title-asc' || option.key === 'created-at-asc'
            "
            size="12"
            :component="ArrowDown"
          />
          <n-icon v-else size="14" :component="Draggable" />
          <span>{{ ft(option.key) }}</span>
        </div>
      </div>
    </template>
  </n-popover>
</template>

<script setup lang="tsx">
import { useSortStore } from "@/store/sort"
import { ArrowDown, ArrowUp, Draggable } from "@vicons/carbon"
import { ChevronForward } from "@vicons/ionicons5"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"

const sortStore = useSortStore()
const { ft } = useHelpi18n()

const handleSortSelect = (key: string) => {
  sortStore.setSortOrder(key)
  sortStore.toggleSortOpen()
}
</script>
