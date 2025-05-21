<template>
  <PopoverWrapper
    :message="
      !expandStore.isCollapseAll ? ft('expand-all') : ft('collapse-all')
    "
    placement="bottom-end"
  >
    <n-button
      tertiary
      :focusable="false"
      size="small"
      class="w-[28px] !shadow-btn-shadow"
      @click="onToggleExpandAll"
    >
      <template #icon>
        <n-icon
          size="20"
          :component="expandStore.isCollapseAll ? RowCollapse : RowExpand"
        />
      </template>
    </n-button>
  </PopoverWrapper>
</template>

<script setup lang="tsx">
import PopoverWrapper from "@/components/popover-wrapper.vue"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import { useExpandStore } from "@/store/expand"
import { RowCollapse, RowExpand } from "@vicons/carbon"

const { ft } = useHelpi18n()
const expandStore = useExpandStore()

const onToggleExpandAll = () => {
  if (!expandStore.isCollapseAll) {
    expandStore.expandAll()
  } else {
    expandStore.collapseAll()
  }
}
</script>
