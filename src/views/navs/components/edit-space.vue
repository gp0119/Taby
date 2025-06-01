<template>
  <PopoverWrapper :message="ft('edit', 'space')" placement="bottom-start">
    <n-button
      tertiary
      :focusable="false"
      size="small"
      class="w-[28px] !shadow-btn-shadow"
      @click="onEditSpace"
    >
      <template #icon>
        <n-icon size="18" :component="Edit" />
      </template>
    </n-button>
  </PopoverWrapper>
</template>

<script setup lang="tsx">
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"
import { useEditDialog } from "@/hooks/useEditDialog.tsx"
import { Edit, Delete } from "@vicons/carbon"
import dataManager from "@/db"
import IconSelect from "@components/icon-select.vue"
import PopoverWrapper from "@/components/popover-wrapper.vue"
import { useRefresh } from "@/hooks/useRresh.ts"
import { useSpacesStore } from "@/store/spaces.ts"

const spacesStore = useSpacesStore()
const { ft, gt } = useHelpi18n()
const { open } = useEditDialog()
const { open: deleteDialog } = useDeleteDialog()
const dialog = useDialog()
const { refreshSpaces, updateContextMenus } = useRefresh()

const props = defineProps<{
  title: string
  icon: string
}>()

function onEditSpace() {
  const formModel = ref({ title: props.title, icon: props.icon })
  open({
    title: ft("edit", "space"),
    renderContent: () => (
      <n-form model={formModel.value}>
        <n-form-item class="!text-text-primary">
          <n-input-group>
            <IconSelect v-model:value={formModel.value.icon} />
            <n-input v-model:value={formModel.value.title} />
            <n-button
              ghost
              type="error"
              onClick={() => onDeleteSpace()}
              v-slots={{
                icon: () => <n-icon size="16" component={Delete} />,
              }}
            />
          </n-input-group>
        </n-form-item>
      </n-form>
    ),
    onPositiveClick: async () => {
      if (!formModel.value.title) return
      await dataManager.updateSpaceTitle(
        spacesStore.activeId,
        formModel.value.title,
        formModel.value.icon,
      )
      await refreshSpaces()
      await updateContextMenus()
    },
  })
}

function onDeleteSpace() {
  deleteDialog({
    title: ft("delete", "space"),
    content: () => (
      <span
        class="text-text-primary"
        v-html={gt("delete-confirm", props.title || "")}
      />
    ),
    onPositiveClick: async () => {
      await dataManager.removeSpace(spacesStore.activeId)
      await refreshSpaces()
      await updateContextMenus()
      dialog.destroyAll()
    },
  })
}
</script>
