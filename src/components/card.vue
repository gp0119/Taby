<template>
  <div
    class="card group/card"
    :class="{ '!shadow-base-lg': selectIds?.includes(child.id) }"
    @click="onHandleClick"
  >
    <div class="card-header">
      <div
        class="mr-2.5 hidden h-[24px] w-[24px] items-center justify-center group-hover/card:flex"
        :class="{ '!flex': selectIds?.includes(child.id) }"
        @click.stop="() => {}"
      >
        <n-checkbox
          :checked="selectIds?.includes(child.id)"
          size="large"
          @update:checked="onHandleCheckbox"
        />
      </div>
      <favicon
        :type="type"
        :child="child"
        v-if="!selectIds?.includes(child.id)"
        class="group-hover/card:hidden"
      />
      <span class="card-title">{{ child.customTitle || child.title }}</span>
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
    <div class="card-title-wrapper">
      <div
        class="select-none overflow-hidden overflow-ellipsis whitespace-nowrap font-light text-text-secondary"
      >
        {{ child.customDescription || child.title }}
      </div>
      <!--   复制按钮   -->
      <n-icon-wrapper
        v-if="isSupported"
        :size="24"
        :border-radius="24"
        @click.stop="onHandleCopy"
        class="copy-button"
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
</template>

<script setup lang="ts">
import { Close, CopyOutline } from "@vicons/ionicons5"
import { Pen } from "@vicons/carbon"
import { Card } from "@/type.ts"
import { useClipboard } from "@vueuse/core"
import favicon from "./favicon.vue"

const props = defineProps<{ child: Card; type: string; selectIds?: number[] }>()
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
  @apply group-hover/aside:bg-hover-color;
  @apply [&:hover_.delete\-button]:flex [&:hover_.delete\-button]:animate-scale-in;
}
.card-header {
  @apply relative flex items-center rounded-md border-0 border-b border-solid px-4 py-3;
}

.card-title {
  @apply flex-1 select-none overflow-hidden overflow-ellipsis whitespace-nowrap font-normal text-text-primary;
}
.delete-button {
  @apply absolute -right-2 hidden rounded-full bg-primary hover:opacity-70;
}
.card-title-wrapper {
  @apply relative p-2.5;
}
.copy-button {
  @apply absolute right-6 hidden rounded-full bg-primary hover:opacity-70;
  @apply group-hover/content:flex group-hover/content:animate-scale-in;
}
.edit-button {
  @apply absolute -right-2.5 hidden rounded-full bg-primary hover:opacity-70;
  @apply group-hover/content:flex group-hover/content:animate-scale-in;
}
</style>
