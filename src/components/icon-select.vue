<template>
  <n-popover
    v-model:show="show"
    trigger="click"
    :to="false"
    content-class="scrollbar-thin scrollbar-gutter-stable max-h-[120px] grid grid-cols-4 gap-2 overflow-scroll"
  >
    <template #trigger>
      <n-button>
        <template #icon>
          <n-icon size="18" :component="ICON_LIST[selectIcon]" />
        </template>
      </n-button>
    </template>
    <div
      v-for="(value, key) in ICON_LIST"
      :key="key"
      class="flex-center h-[30px] w-[30px] cursor-pointer border"
      :class="{
        'border-primary': selectIcon === key,
      }"
      @click="pick(key)"
    >
      <n-icon :component="value" />
    </div>
  </n-popover>
</template>

<script setup lang="ts">
import { ICON_LIST } from "@/utils/constants.ts"

const show = ref(false)
const selectIcon = defineModel("value", {
  type: String,
  default: "StorefrontOutline",
})

const pick = (key: string | number) => {
  selectIcon.value = key as string
  show.value = false
}
</script>
