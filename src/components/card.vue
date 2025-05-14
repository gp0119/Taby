<template>
  <div
    class="card group/card"
    :class="{
      '!shadow-base-lg': selectIds?.includes(child.id),
      'duplicate-card': duplicateUrl === child.url,
    }"
    @click="onHandleClick"
  >
    <div class="card-header">
      <div
        class="favicon-size hidden h-5 w-5 animate-scale-in items-center justify-center group-hover/card:flex"
        :class="{
          '!flex': showCheckbox && selectIds?.includes(child.id),
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
      <favicon
        :child="child"
        class="favicon group-hover/card:hidden"
        :class="{
          '!hidden': selectIds?.includes(child.id),
          '!flex': !showCheckbox,
        }"
      />
      <span class="card-title">{{ child.title }}</span>
      <!--   删除按钮   -->
      <n-icon-wrapper
        :size="16"
        :border-radius="16"
        class="delete-button"
        @click.stop="onHandleDelete"
      >
        <n-icon color="#fff" :size="14" :component="Close" />
      </n-icon-wrapper>
    </div>
    <div class="card-title-wrapper relative px-4 py-2.5">
      <div class="card-description">
        {{ child.description || child.title }}
      </div>
      <div class="bottom-button-wrapper">
        <!--   复制按钮   -->
        <n-icon-wrapper
          v-if="isSupported"
          :size="24"
          :border-radius="24"
          class="copy-button"
          @click.stop="onHandleCopy"
        >
          <n-icon color="#fff" :size="12" :component="CopyOutline" />
        </n-icon-wrapper>
        <!--   编辑按钮   -->
        <n-icon-wrapper
          :size="24"
          :border-radius="24"
          class="edit-button"
          @click.stop="onHandleEdit"
        >
          <n-icon color="#fff" :size="12" :component="Pen" />
        </n-icon-wrapper>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Close, CopyOutline } from "@vicons/ionicons5"
import { Pen } from "@vicons/carbon"
import { Card } from "@/type.ts"
import { useClipboard } from "@vueuse/core"
import favicon from "./favicon.vue"

const props = withDefaults(
  defineProps<{
    child: Card
    selectIds?: number[]
    duplicateUrl?: string | null
    showCheckbox?: boolean
  }>(),
  { showCheckbox: true },
)

const { copy, isSupported } = useClipboard()
const emit = defineEmits(["delete", "click", "copy", "edit", "check"])

function onHandleClick() {
  emit("click")
}

function onHandleDelete() {
  emit("delete")
}

function onHandleCopy() {
  copy(props.child.url)
}

function onHandleEdit() {
  emit("edit")
}

function onHandleCheckbox(checked: boolean) {
  emit("check", checked)
}
</script>
<style scoped>
.card {
  @apply w-full cursor-pointer rounded-md bg-card-color shadow-base;
  @apply [&:hover_.delete\-button]:flex [&:hover_.delete\-button]:animate-scale-in;
}
.card-header {
  @apply relative flex items-center border-0 border-b border-solid px-4 py-3;
  @apply group-hover/aside:rounded-md group-hover/aside:bg-hover-color;
}

.card-title {
  @apply ml-2 flex-1 select-none overflow-hidden overflow-ellipsis whitespace-nowrap font-normal text-text-primary;
}
.card-description {
  @apply select-none overflow-hidden overflow-ellipsis whitespace-nowrap text-xs font-light text-text-secondary;
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
.bottom-button-wrapper {
  @apply absolute -bottom-2.5 -right-2.5 hidden items-center justify-center gap-x-3;
  @apply group-hover/content:flex;
}
.duplicate-card {
  @apply bg-gradient-to-b from-primary to-card-color;
}
</style>
