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
          class="mobile-hover-only favicon-size hidden h-7 w-7 flex-shrink-0 animate-scale-in items-center justify-center group-hover/card:flex"
          :class="{
            '!inline-flex':
              showCheckbox && (selectIds?.includes(child.id) || !canHover),
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
          class="card-favicon-button favicon-size w-[28px] group-hover/card:hidden"
          :class="{
            '!hidden':
              selectIds?.includes(child.id) || (showCheckbox && !canHover),
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
          :class="{ '!inline-flex': !canHover }"
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
        <DeletePopconfirm
          v-if="type === 'tab' && !layoutStore.isRightCollapsed"
          v-model:show="showDelete"
          :content="gt('close-tab-confirm', child.title)"
          :confirm="onHandleDelete"
          placement="left"
        >
          <n-button
            tertiary
            :focusable="false"
            circle
            size="tiny"
            class="close-button hidden h-[20px] w-[20px] animate-scale-in group-hover/card:inline-flex"
            :class="{ '!inline-flex': !canHover || showDelete }"
            :aria-label="ft('close-tabs')"
            @click.stop
          >
            <template #icon>
              <n-icon size="14" class="text-text-primary" :component="Close" />
            </template>
          </n-button>
        </DeletePopconfirm>
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
import DeletePopconfirm from "@/components/delete-popconfirm.vue"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useCanHover } from "@/hooks/useCanHover"

const layoutStore = useLayoutStore()
const canHover = useCanHover()
const { ft, gt } = useHelpi18n()
const showDelete = ref(false)

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

function onHandleClick(e: MouseEvent) {
  emit("click", e)
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
</style>
