<template>
  <n-dropdown
    trigger="hover"
    :options="sortStore.sortOptions"
    :render-label="renderSortLabel"
    :show="sortStore.isSortOpen"
    placement="right-start"
    :show-arrow="false"
    @select="handleSortSelect"
    @update:show="sortStore.toggleSortOpen"
  >
    <div class="flex w-full cursor-pointer items-center justify-between">
      <div class="flex items-center gap-x-2">
        <n-icon-wrapper>
          <n-icon
            v-if="
              sortStore.sortOrder === 'title-desc' ||
              sortStore.sortOrder === 'created-at-desc'
            "
            size="18"
            :component="ArrowUp"
          />
          <n-icon
            v-else-if="
              sortStore.sortOrder === 'title-asc' ||
              sortStore.sortOrder === 'created-at-asc'
            "
            size="18"
            :component="ArrowDown"
          />
          <n-icon v-else size="20" :component="Draggable" />
        </n-icon-wrapper>
        <span>{{ ft(sortStore.sortOrder ?? "draggable") }}</span>
      </div>
      <n-icon size="20" class="text-text-primary" :component="ChevronForward" />
    </div>
  </n-dropdown>
</template>

<script setup lang="tsx">
import { useSortStore } from "@/store/sort.js"
import { ArrowDown, ArrowUp, Draggable } from "@vicons/carbon"
import { ChevronForward } from "@vicons/ionicons5"
import { SelectGroupOption, SelectOption } from "naive-ui"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"

const sortStore = useSortStore()
const { ft } = useHelpi18n()

const renderSortLabel = (option: SelectOption | SelectGroupOption) => {
  return (
    <span class="flex items-center gap-x-1">
      {option.key === "title-desc" || option.key === "created-at-desc" ? (
        <n-icon size="12" component={ArrowUp} />
      ) : option.key === "title-asc" || option.key === "created-at-asc" ? (
        <n-icon size="12" component={ArrowDown} />
      ) : (
        <n-icon size="14" component={Draggable} />
      )}
      <span> {option.label}</span>
    </span>
  )
}

const handleSortSelect = (key: string) => {
  sortStore.setSortOrder(key)
}
</script>
