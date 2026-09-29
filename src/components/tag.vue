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
      <DeletePopconfirm
        v-if="closeable"
        v-model:show="showDelete"
        :content="gt('remove-tag-confirm', tag.title)"
        :confirm="onDeleteTag"
      >
        <n-icon-wrapper
          :border-radius="10"
          icon-color="#fff"
          :size="14"
          class="mobile-hover-only absolute -right-1.5 -top-1.5 z-10 hidden bg-error-color group-hover/tag:inline-flex"
          :class="{ '!inline-flex': !canHover || showDelete }"
          @click.stop
        >
          <n-icon :component="Close" />
        </n-icon-wrapper>
      </DeletePopconfirm>
      <n-icon
        v-if="removeable"
        :component="Close"
        :size="14"
        @click.stop="onRemoveTag"
      />
    </div>
  </n-tag>
</template>

<script setup lang="tsx">
import { Label } from "@/type"
import { Close } from "@vicons/ionicons5"
import DeletePopconfirm from "@/components/delete-popconfirm.vue"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useCanHover } from "@/hooks/useCanHover"

const canHover = useCanHover()
const { gt } = useHelpi18n()
const showDelete = ref(false)

withDefaults(
  defineProps<{
    tag: Label
    closeable?: boolean
    titleClass?: string
    removeable?: boolean
  }>(),
  {
    removeable: false,
  },
)

const emit = defineEmits<{
  (e: "delete"): void
  (e: "remove"): void
}>()

const onDeleteTag = async () => {
  emit("delete")
}

const onRemoveTag = async () => {
  emit("remove")
}
</script>
