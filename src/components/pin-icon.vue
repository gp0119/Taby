<template>
  <n-popover
    v-model:show="showPopover"
    trigger="hover"
    :placement="placement"
    content-class="!p-0"
    :show-arrow="false"
  >
    <template #trigger>
      <n-button :focusable="false" quaternary size="small" class="w-7">
        <template #icon>
          <n-icon :size="18" class="cursor-pointer">
            <svg
              class="h-5 w-5 cursor-pointer"
              :class="{
                'rotate-180': side === 'right',
              }"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                :d="pathMap[mode]"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </n-icon>
        </template>
      </n-button>
    </template>
    <div class="flex gap-x-2">
      <template v-for="option in options" :key="option">
        <popover-wrapper :message="option">
          <svg
            class="h-5 w-5 cursor-pointer"
            :class="{
              'rotate-180': side === 'right',
            }"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            @click="onChangeMode(option)"
          >
            <path
              :d="pathMap[option]"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </popover-wrapper>
      </template>
    </div>
  </n-popover>
</template>

<script setup lang="tsx">
import popoverWrapper from "./popover-wrapper.vue"
import type { layoutMode } from "@/type"
import type { PopoverPlacement } from "naive-ui"

withDefaults(
  defineProps<{
    mode: layoutMode
    side: "left" | "right"
    options?: layoutMode[]
    placement?: PopoverPlacement
  }>(),
  {
    options: () => ["collapse", "expand", "hover"],
  },
)

const showPopover = ref(false)

const pathMap: Record<string, string> = {
  collapse:
    "M8.66667 23.3333V8.66667M10.4 4H21.6C23.8403 4 24.9603 4 25.816 4.43597C26.5687 4.81947 27.1805 5.43139 27.564 6.18404C28 7.03968 28 8.15979 28 10.4V21.6C28 23.8403 28 24.9603 27.564 25.816C27.1805 26.5687 26.5687 27.1805 25.816 27.564C24.9603 28 23.8403 28 21.6 28H10.4C8.15979 28 7.03968 28 6.18404 27.564C5.43139 27.1805 4.81947 26.5687 4.43597 25.816C4 24.9603 4 23.8403 4 21.6V10.4C4 8.15979 4 7.03968 4.43597 6.18404C4.81947 5.43139 5.43139 4.81947 6.18404 4.43597C7.03968 4 8.15979 4 10.4 4Z",
  expand:
    "M12 4V28M10.4 4H21.6C23.8403 4 24.9603 4 25.816 4.43597C26.5687 4.81947 27.1805 5.43139 27.564 6.18404C28 7.03968 28 8.15979 28 10.4V21.6C28 23.8403 28 24.9603 27.564 25.816C27.1805 26.5687 26.5687 27.1805 25.816 27.564C24.9603 28 23.8403 28 21.6 28H10.4C8.15979 28 7.03968 28 6.18404 27.564C5.43139 27.1805 4.81947 26.5687 4.43597 25.816C4 24.9603 4 23.8403 4 21.6V10.4C4 8.15979 4 7.03968 4.43597 6.18404C4.81947 5.43139 5.43139 4.81947 6.18404 4.43597C7.03968 4 8.15979 4 10.4 4Z",
  hover:
    "M8.66667 23.3333V8.66667M13.5 4H10.4C8.15979 4 7.03968 4 6.18404 4.43597C5.43139 4.81947 4.81947 5.43139 4.43597 6.18404C4 7.03968 4 8.15979 4 10.4V21.6C4 23.8403 4 24.9603 4.43597 25.816C4.81947 26.5687 5.43139 27.1805 6.18404 27.564C7.03968 28 8.15979 28 10.4 28H13.5M13.5 4H21.6C23.8403 4 24.9603 4 25.816 4.43597C26.5687 4.81947 27.1805 5.43139 27.564 6.18404C28 7.03968 28 8.15979 28 10.4V21.6C28 23.8403 28 24.9603 27.564 25.816C27.1805 26.5687 26.5687 27.1805 25.816 27.564C24.9603 28 23.8403 28 21.6 28H13.5M13.5 4V28",
}

const emit = defineEmits<{
  (e: "update:mode", mode: layoutMode): void
}>()

const onChangeMode = (mode: layoutMode) => {
  emit("update:mode", mode)
  showPopover.value = false
}
</script>
