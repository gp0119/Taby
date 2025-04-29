<template>
  <n-tag
    :key="tag.id"
    class="!rounded px-2"
    size="small"
    :color="{
      color: `${tag.color}33`,
      textColor: tag.color,
      borderColor: `${tag.color}4A`,
    }"
  >
    <div class="flex items-center">
      <span :class="titleClass">{{ tag.title }}</span>
      <n-icon-wrapper
        v-if="closeable"
        border-radius="10"
        icon-color="#fff"
        size="12"
        class="absolute -right-1 -top-1 z-10 hidden cursor-pointer group-hover/tag:block"
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
