<template>
  <PopoverWrapper :message="ft('add', 'collection')" placement="bottom-end">
    <n-button
      tertiary
      :focusable="false"
      size="small"
      class="w-[28px] !shadow-btn-shadow"
      @click="onAddCollection"
    >
      <template #icon>
        <n-icon size="20" :component="Add" />
      </template>
    </n-button>
  </PopoverWrapper>
</template>

<script setup lang="tsx">
import PopoverWrapper from "@/components/popover-wrapper.vue"
import { Add } from "@vicons/carbon"
import { useEditDialog } from "@/hooks/useEditDialog.tsx"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import { useRefresh } from "@/hooks/useRresh.ts"
import dataManager from "@/db"
import { useSpacesStore } from "@/store/spaces.ts"
import { movePosition } from "@/type"

const { open } = useEditDialog()
const { ft } = useHelpi18n()
const { refreshCollections } = useRefresh()
const spacesStore = useSpacesStore()
function onAddCollection() {
  const formModel = ref<{
    title: string
    position: movePosition
  }>({ title: "", position: "END" })
  open({
    title: ft("add", "collection"),
    renderContent: () => (
      <n-form model={formModel.value}>
        <n-form-item label={`${ft("title")}:`}>
          <n-input
            v-model:value={formModel.value.title}
            placeholder={ft("placeholder", "title")}
          />
        </n-form-item>
        <n-form-item label={`${ft("position")}:`}>
          <n-radio-group
            class="w-full"
            v-model:value={formModel.value.position}
          >
            <n-radio-button class="w-1/2 text-center" value="HEAD">
              {ft("move-to-head")}
            </n-radio-button>
            <n-radio-button class="w-1/2 text-center" value="END">
              {ft("move-to-end")}
            </n-radio-button>
          </n-radio-group>
        </n-form-item>
      </n-form>
    ),
    onPositiveClick: async () => {
      if (!formModel.value.title) return
      await dataManager.addCollection(
        {
          title: formModel.value.title,
          spaceId: spacesStore.activeId,
          labelIds: [],
        },
        formModel.value.position,
      )
      await refreshCollections()
    },
  })
}
</script>
