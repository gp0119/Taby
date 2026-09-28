<template>
  <PopoverWrapper :message="ft('add', 'collection')" placement="bottom-end">
    <n-button
      tertiary
      :focusable="false"
      size="small"
      class="w-[28px] !shadow-btn-shadow"
      @click="onAddCollection"
    >
      <template #icon>
        <n-icon
          size="20"
          :component="Add"
          class="[&_svg]:stroke-current [&_svg]:stroke-[0.5px]"
        />
      </template>
    </n-button>
  </PopoverWrapper>
</template>

<script setup lang="ts">
import PopoverWrapper from "@/components/popover-wrapper.vue"
import { Add } from "@vicons/carbon"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import { useSpacesStore } from "@/store/spaces.ts"

const { ft } = useHelpi18n()
const spacesStore = useSpacesStore()

function onAddCollection() {
  spacesStore.startDraftCollection(ft("untitled"))
}
</script>
