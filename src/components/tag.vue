<template>
  <n-tag
    :key="tag.id"
    class="cursor-pointer !rounded px-2"
    size="small"
    :color="{
      color: `${tag.color}33`,
      textColor: tag.color,
      borderColor: `${tag.color}4A`,
    }"
  >
    <div class="flex items-center">
      <span :class="titleClass" class="cursor-pointer text-center">
        {{ tag.title }}
      </span>
      <n-icon-wrapper
        v-if="closeable"
        border-radius="10"
        icon-color="#fff"
        size="14"
        class="bg-error-color absolute -right-1.5 -top-1.5 z-10 hidden group-hover/tag:inline-flex"
        @click.stop="onDeleteTag"
      >
        <n-icon :component="Close" />
      </n-icon-wrapper>
    </div>
  </n-tag>
</template>

<script setup lang="tsx">
import { Label } from "@/type"
import { Close } from "@vicons/ionicons5"

defineProps<{
  tag: Label
  closeable?: boolean
  titleClass?: string
}>()

const emit = defineEmits<{
  (e: "delete"): void
}>()

const onDeleteTag = async () => {
  emit("delete")
}
</script>
