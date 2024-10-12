<template>
  <div class="flex h-full flex-col">
    <div>
      <div
        class="flex h-[50px] items-center justify-between border-0 border-b border-solid px-4 leading-[50px]"
      >
        <span class="text-xl">gp</span>
        <n-icon
          size="20"
          class="cursor-pointer text-red-600"
          :component="SwapHorizontal"
        />
      </div>
      <div class="flex justify-between px-4 py-2.5">
        <span class="font-bold">SPACES</span>
        <n-icon size="18" class="text-red-600" :component="Add" />
      </div>
    </div>
    <div class="flex-1 px-4">
      <div class="flex items-center py-2 font-medium text-red-600">
        <n-icon size="18" :component="BagHandleOutline" />
        <span class="px-1">My Collections</span>
      </div>
    </div>
    <div class="border-0 border-t border-solid px-2.5 py-4">
      <div class="flex items-center">
        <n-icon size="18" :component="SettingsOutline" />
        <span class="px-1">Setting</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Add,
  SettingsOutline,
  BagHandleOutline,
  SwapHorizontal,
} from "@vicons/ionicons5"
</script>
