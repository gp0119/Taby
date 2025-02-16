<template>
  <div class="card" @click="onHandleClick">
    <div class="card-header">
      <n-avatar
        :src="
          type === 'right-aside'
            ? getFaviconFromCache(child.url)
            : faviconURL(child.url)
        "
        class="card-avatar"
      >
        <template #fallback>
          <div class="flex-center w-full">
            <n-icon
              class="bg-white"
              color="#999"
              size="24"
              :component="DocumentTextOutline"
            />
          </div>
        </template>
      </n-avatar>
      <span class="card-title">{{ child.customTitle || child.title }}</span>
      <!--   删除按钮   -->
      <n-icon-wrapper :size="16" :border-radius="16" class="delete-button">
        <n-icon
          color="#fff"
          :size="14"
          @click.stop="onHandleDelete"
          :component="Close"
        />
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
        class="copy-button"
      >
        <n-icon
          color="#fff"
          :size="12"
          @click.stop="onHandleCopy"
          :component="CopyOutline"
        />
      </n-icon-wrapper>
      <!--   编辑按钮   -->
      <n-icon-wrapper :size="24" :border-radius="24" class="edit-button">
        <n-icon
          color="#fff"
          :size="12"
          @click.stop="onHandleEdit"
          :component="Pen"
        />
      </n-icon-wrapper>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DocumentTextOutline, Close, CopyOutline } from "@vicons/ionicons5"
import { Pen } from "@vicons/carbon"
import { faviconURL, getFaviconFromCache } from "@/utils"
import { Card } from "@/type.ts"
import { useClipboard } from "@vueuse/core"

const props = defineProps<{ child: Card; type: string }>()
const { copy, isSupported } = useClipboard()

const emit = defineEmits(["delete", "click", "copy", "edit"])

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
</script>
<style scoped>
.card {
  @apply bg-card-color w-full cursor-pointer rounded-md shadow-base;
  @apply group-hover/aside:bg-hover-color;
  @apply [&:hover_.delete\-button]:flex [&:hover_.delete\-button]:animate-scale-in;
}
.card-header {
  @apply relative flex items-center rounded-md border-0 border-b border-solid px-4 py-3;
  @apply group-[.right-aside-item]/aside:p-2;
}
.card-avatar {
  @apply mr-2.5 flex-shrink-0 bg-white sepia-base;
  @apply group-[.drag-item]/content:h-[24px] group-[.drag-item]/content:w-[24px];
  @apply group-[.right-aside-item]/aside:h-[20px] group-[.right-aside-item]/aside:w-[20px];
}

.card-title {
  @apply flex-1 select-none overflow-hidden overflow-ellipsis whitespace-nowrap font-normal text-text-primary;
}
.delete-button {
  @apply absolute -right-2 hidden rounded-full bg-primary hover:opacity-70;
  @apply group-[.drag-item]/content:-top-1.5;
  @apply group-[.right-aside-item]/aside:top-2.5;
}
.card-title-wrapper {
  @apply relative p-2.5;
  @apply group-[.right-aside-item]/aside:hidden;
}
.copy-button {
  @apply absolute right-6 hidden rounded-full bg-primary hover:opacity-70;
  @apply group-hover/content:flex group-hover/content:animate-scale-in;
  @apply group-[.drag-item]/content:-bottom-2;
}
.edit-button {
  @apply absolute -right-2.5 hidden rounded-full bg-primary hover:opacity-70;
  @apply group-hover/content:flex group-hover/content:animate-scale-in;
  @apply group-[.drag-item]/content:-bottom-2;
}
</style>
