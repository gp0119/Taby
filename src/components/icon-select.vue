<template>
  <n-popover trigger="hover" content-class="!p-0">
    <template #trigger>
      <n-button>
        <template #icon>
          <n-icon size="18" :component="ICON_LIST[selectIcon]" />
        </template>
      </n-button>
    </template>
    <n-scrollbar class="max-h-[100px] w-[160px]">
      <n-space wrap size="small" align="center">
        <div
          v-for="(value, key) in ICON_LIST"
          :key="key"
          class="flex-center h-[30px] w-[30px] cursor-pointer overflow-hidden border"
          :class="{
            'border-primary': selectIcon === key,
          }"
          @click="pick(key)"
        >
          <n-icon :component="value" />
        </div>
      </n-space>
    </n-scrollbar>
  </n-popover>
</template>

<script setup lang="ts">
import { ICON_LIST } from "@/utils/constants.ts"

const selectIcon = defineModel("value", {
  type: String,
  default: "StorefrontOutline",
})

const pick = (key: string | number) => {
  selectIcon.value = key as string
}
</script>
