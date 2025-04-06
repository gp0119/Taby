<template>
  <TopAction v-model:show="show" @close="onCancel">
    <div
      class="flex-center select-none gap-x-3 font-medium text-text-secondary"
    >
      <span
        v-html="
          gt(
            'current-duplicate-count',
            duplicateCardStore.currentDuplicateCount,
          )
        "
      ></span>
      <span class="h-[16px] w-[0.5px] bg-text-primary"></span>
      <span class="font-medium">
        {{
          duplicateCardStore.duplicateCards.size > 0
            ? duplicateCardStore.currentIndex + 1
            : 0
        }}
        /
        {{ duplicateCardStore.duplicateCards.size }}
      </span>
    </div>
    <div class="flex items-center justify-between gap-x-4">
      <n-button
        secondary
        size="small"
        :disabled="duplicateCardStore.currentIndex === 0"
        type="primary"
        @click="showPrevious"
      >
        <template #icon>
          <n-icon :size="16" :component="PreviousOutline" />
        </template>
        {{ ft("previous") }}
      </n-button>
      <n-button
        secondary
        size="small"
        :disabled="
          duplicateCardStore.currentIndex >=
          duplicateCardStore.duplicateCards.size - 1
        "
        type="primary"
        @click="showNext"
      >
        <template #icon>
          <n-icon :size="16" :component="NextOutline" />
        </template>
        {{ ft("next") }}
      </n-button>
    </div>
  </TopAction>
</template>

<script setup lang="ts">
import TopAction from "@/components/top-action.vue"
import { PreviousOutline, NextOutline } from "@vicons/carbon"
import { useDuplicateCardStore } from "@/store/duplicate-card"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import { useDuplicateCard } from "@/hooks/useDuplicateCard"

const { ft, gt } = useHelpi18n()
const duplicateCardStore = useDuplicateCardStore()
const { showPrevious, showNext } = useDuplicateCard()
const show = ref(false)
function onCancel() {
  duplicateCardStore.setIsFindDuplicate(false)
}

watch(
  () => duplicateCardStore.isFindDuplicate,
  (value) => {
    show.value = value
  },
)
</script>
