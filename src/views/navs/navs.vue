<template>
  <div
    class="flex h-[50px] items-center justify-between border-0 border-b border-solid px-6 [&_.n\-base\-selection\-input]:!pl-1 [&_.n\-base\-selection\-input]:!pr-1"
  >
    <div class="flex items-center gap-4">
      <template v-if="title">
        <div class="flex-center">
          <n-icon size="20" class="mr-1">
            <component :is="ICON_LIST[icon ?? 'StorefrontOutline']" />
          </n-icon>
          <span class="shrink-0 select-none text-xl text-text-primary">{{
            title
          }}</span>
        </div>
        <span class="h-[16px] w-[0.5px] bg-text-primary"></span>
        <span class="font-thin text-text-secondary"
          >{{ spacesStore.collections.length }} Collections</span
        >
      </template>
    </div>
    <div class="flex-center flex-shrink-0 gap-3">
      <n-icon
        size="20"
        class="cursor-pointer text-primary"
        @click="onEditSpace"
      >
        <Settings />
      </n-icon>
      <LangSwitch />
      <n-select
        size="tiny"
        :show-checkmark="false"
        :show-arrow="false"
        :consistent-menu-width="false"
        v-model:value="currentTheme"
        :options="themeOptions"
        @update:value="onUpdateValue"
        :render-label="renderLabel"
      >
      </n-select>
    </div>
  </div>
  <nav-action />
</template>

<script setup lang="tsx">
import { useRefresh } from "@/hooks/useRresh.ts"
import { useSpacesStore } from "@/store/spaces.ts"
import { useTagsStore } from "@/store/tags.ts"
import { useThemeStore } from "@/store/theme.ts"
import LangSwitch from "./components/lang-switch.vue"
import NavAction from "@/views/navs/components/nav-action.vue"
import { Settings } from "@vicons/ionicons5"
import { Delete } from "@vicons/carbon"
import dataManager from "@/db"
import { SelectOption, SelectGroupOption } from "naive-ui"
import IconSelect from "@components/icon-select.vue"
import { ICON_LIST } from "@/utils/constants.ts"
import { useEditDialog } from "@/hooks/useEditDialog.tsx"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import { useDeleteDialog } from "@/hooks/useDeleteDialog.tsx"
const { themeColor, theme, setTheme } = useThemeStore()

const currentTheme = ref(theme)

const themeOptions = Object.keys(themeColor).map((key) => ({
  label: key,
  value: key,
  color: themeColor[key].primary,
}))

const onUpdateValue = (value: string) => {
  setTheme(value)
}

const renderLabel = (option: SelectOption | SelectGroupOption) => {
  return <div class="h-4 w-4" style={`background: ${option.color}`}></div>
}

const tagsStore = useTagsStore()
const spacesStore = useSpacesStore()
const { open } = useEditDialog()
const { open: deleteDialog } = useDeleteDialog()
const dialog = useDialog()
const { ft, gt } = useHelpi18n()
const { refreshSpaces, refreshCollections } = useRefresh()

watch(
  () => spacesStore.activeId,
  async () => {
    await tagsStore.fetchCollectionsTags()
  },
  { immediate: true },
)

const title = computed(
  () =>
    spacesStore.spaces.find((item) => item.id === spacesStore.activeId)?.title,
)

const icon = computed(
  () =>
    spacesStore.spaces.find((item) => item.id === spacesStore.activeId)?.icon,
)

function onEditSpace() {
  const formModel = ref({ title: title.value, icon: icon.value })
  open({
    title: ft("edit", "space"),
    renderContent: () => (
      <n-form model={formModel.value}>
        <n-form-item class="!text-text-primary">
          <n-input-group>
            <IconSelect v-model:value={formModel.value.icon} />
            <n-input v-model:value={formModel.value.title} />
            <n-button
              secondary
              type="error"
              onClick={() => onDeleteSpace()}
              v-slots={{
                icon: () => (
                  <n-icon>
                    <Delete />
                  </n-icon>
                ),
              }}
            ></n-button>
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
      await spacesStore.fetchSpaces()
    },
  })
}

function onDeleteSpace() {
  deleteDialog({
    title: ft("delete", "space"),
    content: () => (
      <span
        class="text-text-primary"
        v-html={gt("delete-confirm", title.value || "")}
      />
    ),
    onPositiveClick: async () => {
      await dataManager.removeSpace(spacesStore.activeId)
      await refreshSpaces()
      await spacesStore.setActiveSpace(spacesStore.spaces[0].id)
      await refreshCollections()
      dialog.destroyAll()
    },
  })
}
</script>
