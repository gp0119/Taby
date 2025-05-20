<template>
  <n-popover
    v-if="!layoutStore.leftAsideCollapsed"
    trigger="hover"
    placement="bottom"
    :keep-alive-on-hover="false"
    content-class="!p-0"
  >
    <template #trigger>
      <n-icon :size="18" class="cursor-pointer" @click.stop="onClick">
        <svg
          v-if="!layoutStore.leftAsidePinned"
          class="h-5 w-5 cursor-pointer"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8.66667 23.3333V8.66667M10.4 4H21.6C23.8403 4 24.9603 4 25.816 4.43597C26.5687 4.81947 27.1805 5.43139 27.564 6.18404C28 7.03968 28 8.15979 28 10.4V21.6C28 23.8403 28 24.9603 27.564 25.816C27.1805 26.5687 26.5687 27.1805 25.816 27.564C24.9603 28 23.8403 28 21.6 28H10.4C8.15979 28 7.03968 28 6.18404 27.564C5.43139 27.1805 4.81947 26.5687 4.43597 25.816C4 24.9603 4 23.8403 4 21.6V10.4C4 8.15979 4 7.03968 4.43597 6.18404C4.81947 5.43139 5.43139 4.81947 6.18404 4.43597C7.03968 4 8.15979 4 10.4 4Z"
            stroke="black"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <svg
          v-else
          class="h-5 w-5 cursor-pointer"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 4V28M10.4 4H21.6C23.8403 4 24.9603 4 25.816 4.43597C26.5687 4.81947 27.1805 5.43139 27.564 6.18404C28 7.03968 28 8.15979 28 10.4V21.6C28 23.8403 28 24.9603 27.564 25.816C27.1805 26.5687 26.5687 27.1805 25.816 27.564C24.9603 28 23.8403 28 21.6 28H10.4C8.15979 28 7.03968 28 6.18404 27.564C5.43139 27.1805 4.81947 26.5687 4.43597 25.816C4 24.9603 4 23.8403 4 21.6V10.4C4 8.15979 4 7.03968 4.43597 6.18404C4.81947 5.43139 5.43139 4.81947 6.18404 4.43597C7.03968 4 8.15979 4 10.4 4Z"
            stroke="black"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </n-icon>
    </template>
    <div class="text-xs">Pin</div>
  </n-popover>
</template>

<script setup>
import { useLayoutStore } from "@/store/layout"

const layoutStore = useLayoutStore()

const onClick = () => {
  console.log(111)
  layoutStore.onUpdateLeftAsidePinned(!layoutStore.leftAsidePinned)
}
</script>
