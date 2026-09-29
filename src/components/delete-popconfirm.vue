<template>
  <n-popconfirm
    v-model:show="show"
    :placement="placement"
    :positive-text="ft('confirm')"
    :negative-text="ft('cancel')"
    :positive-button-props="{ loading, disabled: loading }"
    :negative-button-props="{ disabled: loading }"
    @positive-click="onConfirm"
  >
    <template #trigger>
      <slot />
    </template>
    <span class="text-text-primary">
      <template v-if="content">{{ content }}</template>
      <template v-else>
        {{ ft("delete-confirm-prefix") }}
        <span class="text-primary">{{ name }}</span>
        {{ ft("delete-confirm-suffix") }}
      </template>
    </span>
  </n-popconfirm>
</template>

<script setup lang="ts">
import { NPopconfirm, useMessage } from "naive-ui"
import type { PopconfirmProps } from "naive-ui"
import { useHelpi18n } from "@/hooks/useHelpi18n"

const props = withDefaults(
  defineProps<{
    name?: string
    content?: string
    placement?: PopconfirmProps["placement"]
    confirm: () => void | Promise<void>
  }>(),
  { placement: "top" },
)
const show = defineModel<boolean>("show", { default: false })
const loading = ref(false)
const { ft } = useHelpi18n()
const message = useMessage()
const onPopconfirmShowChange = inject<((show: boolean) => void) | undefined>(
  "onPopconfirmShowChange",
  undefined,
)

watch(
  show,
  (value, previous) => {
    if (value || previous) onPopconfirmShowChange?.(value)
  },
  { immediate: true, flush: "sync" },
)
onBeforeUnmount(() => {
  if (show.value) onPopconfirmShowChange?.(false)
})

async function onConfirm() {
  if (loading.value) return false
  loading.value = true
  try {
    await props.confirm()
  } catch (error) {
    message.error(error instanceof Error ? error.message : ft("fail"))
    return false
  } finally {
    loading.value = false
  }
}
</script>
