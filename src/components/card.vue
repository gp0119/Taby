<template>
  <div
    class="w-full cursor-pointer rounded border border-gray-100 bg-white group-hover/aside:border-gray-400 group-[.drag-item]/content:shadow-card [&:hover_.delete]:flex"
    @click="onHandleClick"
  >
    <div
      class="relative flex items-center rounded border-0 border-b border-solid px-4 py-3 group-[.right-aside-item]/aside:p-2"
    >
      <n-avatar
        :src="
          type === 'right-aside'
            ? getFaviconFromCache(child.url)
            : faviconURL(child.url)
        "
        class="mr-2.5 flex-shrink-0 bg-white group-[.drag-item]/content:h-[24px] group-[.right-aside-item]/aside:h-[20px] group-[.drag-item]/content:w-[24px] group-[.right-aside-item]/aside:w-[20px]"
      >
        <template #fallback>
          <div class="flex w-full items-center justify-center">
            <n-icon
              class="bg-white"
              color="#999"
              size="24"
              :component="DocumentTextOutline"
            />
          </div>
        </template>
      </n-avatar>
      <span
        class="flex-1 select-none overflow-hidden overflow-ellipsis whitespace-nowrap font-normal"
        >{{ child.customTitle || child.title }}</span
      >
      <!--   删除按钮   -->
      <n-icon-wrapper
        :size="16"
        :border-radius="16"
        class="delete absolute -right-2.5 hidden rounded-full bg-gray-300 hover:bg-red-450 group-[.drag-item]/content:-top-1.5 group-[.right-aside-item]/aside:top-1/2 group-[.right-aside-item]/aside:-translate-y-1/2"
      >
        <n-icon
          color="#fff"
          :size="12"
          @click.stop="onHandleDelete"
          :component="Close"
        />
      </n-icon-wrapper>
    </div>
    <div class="relative p-2.5 group-[.right-aside-item]/aside:hidden">
      <div
        class="select-none overflow-hidden overflow-ellipsis whitespace-nowrap font-light"
      >
        {{ child.customDescription || child.title }}
      </div>
      <!--   复制按钮   -->
      <n-icon-wrapper
        v-if="isSupported"
        :size="24"
        :border-radius="24"
        class="absolute right-6 hidden rounded-full bg-red-450 group-hover/content:flex group-[.drag-item]/content:-bottom-2"
      >
        <n-icon
          color="#fff"
          :size="12"
          @click.stop="onHandleCopy"
          :component="CopyOutline"
        />
      </n-icon-wrapper>
      <!--   编辑按钮   -->
      <n-icon-wrapper
        :size="24"
        :border-radius="24"
        class="absolute -right-2.5 hidden rounded-full bg-red-450 group-hover/content:flex group-[.drag-item]/content:-bottom-2"
      >
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
