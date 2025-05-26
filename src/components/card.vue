<template>
  <div
    class="card group/card border-2 border-transparent"
    :class="{
      '!border-primary': selectIds?.includes(child.id),
      '!border-dashed !border-primary': duplicateUrl === child.url,
    }"
    @click="onHandleClick"
  >
    <PopoverWrapper
      :message="child.title"
      :disabled="type === 'card' || !layoutStore.isRightCollapsed"
      placement="left"
    >
      <div class="card-header">
        <div
          class="favicon-size hidden h-7 w-7 flex-shrink-0 animate-scale-in items-center justify-center group-hover/card:flex"
          :class="{
            '!inline-flex': showCheckbox && selectIds?.includes(child.id),
            '!hidden': !showCheckbox,
          }"
          @click.stop="() => {}"
        >
          <n-checkbox
            :checked="selectIds?.includes(child.id)"
            size="large"
            @update:checked="onHandleCheckbox"
          />
        </div>
        <n-button
          :focusable="false"
          size="small"
          class="favicon-size w-[28px] group-hover/card:hidden"
          :class="{
            '!hidden': selectIds?.includes(child.id),
            '!flex': !showCheckbox,
          }"
        >
          <template #icon>
            <favicon :child="child" />
          </template>
        </n-button>

        <span class="card-title text-ellipsis">{{ child.title }}</span>

        <n-button
          quaternary
          :focusable="false"
          size="tiny"
          class="more-button hidden w-[22px] animate-scale-in group-hover/card:inline-flex"
          @click.stop="onHandleEdit"
        >
          <template #icon>
            <n-icon
              size="16"
              class="text-text-primary"
              :component="EllipsisVerticalSharp"
            />
          </template>
        </n-button>
        <n-button
          v-if="!layoutStore.isRightCollapsed"
          tertiary
          :focusable="false"
          circle
          size="tiny"
          class="close-button hidden h-[20px] w-[20px] animate-scale-in group-hover/card:inline-flex"
          @click.stop="onHandleDelete"
        >
          <template #icon>
            <n-icon size="14" class="text-text-primary" :component="Close" />
          </template>
        </n-button>
      </div>
    </PopoverWrapper>
    <div
      class="card-description-wrapper relative border-t border-solid px-2 py-1.5"
    >
      <div class="card-description text-ellipsis">
        {{ child.description || child.title }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card } from "@/type.ts"
import favicon from "./favicon.vue"
import { EllipsisVerticalSharp } from "@vicons/ionicons5"
import { Close } from "@vicons/carbon"
import PopoverWrapper from "@/components/popover-wrapper.vue"
import { useLayoutStore } from "@/store/layout"

const layoutStore = useLayoutStore()

withDefaults(
  defineProps<{
    type: "card" | "tab"
    child: Card
    selectIds?: number[]
    duplicateUrl?: string | null
    showCheckbox?: boolean
  }>(),
  { showCheckbox: true },
)

const emit = defineEmits(["click", "edit", "check", "delete"])

function onHandleClick() {
  emit("click")
}

function onHandleEdit() {
  emit("edit")
}

function onHandleDelete() {
  emit("delete")
}

function onHandleCheckbox(checked: boolean) {
  emit("check", checked)
}
</script>
<style>
.card {
  @apply relative w-full cursor-pointer rounded-md bg-card-color shadow-card-shadow;
  @apply [&:hover_.delete\-button]:flex [&:hover_.delete\-button]:animate-scale-in;
}
.card-header {
  @apply relative flex items-center p-2;
}

.card-title {
  @apply ml-2 flex-1 select-none font-normal text-text-primary;
}
.card-description {
  @apply select-none text-xs font-light text-text-secondary;
}
.delete-button {
  @apply absolute -right-2 hidden rounded-full bg-primary hover:opacity-70;
}
.copy-button {
  @apply animate-scale-in rounded-full bg-primary hover:opacity-70;
}
.edit-button {
  @apply animate-scale-in rounded-full bg-primary hover:opacity-70;
}
</style>
