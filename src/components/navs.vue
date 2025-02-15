<template>
  <div
    class="flex h-[50px] items-center justify-between border-0 border-b border-solid px-4 py-2.5 [&_.n\-base\-selection\-input]:!pl-1 [&_.n\-base\-selection\-input]:!pr-1"
  >
    <span class="select-none text-xl text-primary">{{ title }}</span>
    <n-space>
      <n-button size="tiny" type="primary" @click="onAddCollection">
        <span>ADD COLLECTION</span>
        <template #icon>
          <n-icon>
            <Add />
          </n-icon>
        </template>
      </n-button>
      <n-icon
        size="20"
        class="cursor-pointer text-primary"
        @click="onEditSpace"
      >
        <Settings />
      </n-icon>
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
    </n-space>
  </div>
</template>

<script setup lang="tsx">
import { useSpacesStore } from "@/store/spaces.ts"
import { useThemeStore } from "@/store/theme.ts"
import { Add, Settings } from "@vicons/ionicons5"
import { Delete } from "@vicons/carbon"
import DataManager from "@/db"
import { SelectOption, SelectGroupOption } from "naive-ui"

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

const spacesStore = useSpacesStore()
const dataManager = new DataManager()

const dialog = useDialog()
function onAddCollection() {
  const formModel = ref({ title: "" })
  dialog.create({
    title: () => {
      return <span>Add Collection</span>
    },
    titleClass: "[&_.n-base-icon]:hidden",
    negativeText: "Cancel",
    positiveText: "Save",
    content: () => (
      <n-form model={formModel.value}>
        <n-form-item label="Title">
          <n-input v-model:value={formModel.value.title} />
        </n-form-item>
      </n-form>
    ),
    onPositiveClick: async () => {
      if (!formModel.value.title) return
      await dataManager.addCollection({
        title: formModel.value.title,
        spaceId: spacesStore.activeId,
        labelIds: [],
      })
      await spacesStore.fetchCollections(spacesStore.activeId)
    },
  })
}

const title = computed(
  () =>
    spacesStore.spaces.find((item) => item.id === spacesStore.activeId)?.title,
)

function onEditSpace() {
  const formModel = ref({ title: title.value })
  dialog.create({
    title: () => {
      return <span>Edit Space</span>
    },
    titleClass: "[&_.n-base-icon]:hidden",
    negativeText: "Cancel",
    positiveText: "Save",
    content: () => (
      <div>
        <n-form model={formModel.value} label-placement="left">
          <n-form-item label="Space Title: ">
            <n-input v-model:value={formModel.value.title} />
          </n-form-item>
        </n-form>
        <n-button
          size="small"
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
        >
          <span>DELETE SPACE</span>
        </n-button>
      </div>
    ),
    onPositiveClick: async () => {
      if (!formModel.value.title) return
      await dataManager.updateSpaceTitle(
        spacesStore.activeId,
        formModel.value.title,
      )
      await spacesStore.fetchSpaces()
    },
  })
}

function onDeleteSpace() {
  dialog.error({
    title: "Delete Space",
    content: () => {
      return (
        <span>
          Are you sure you want to delete{" "}
          <span class="text-primary">{title.value}</span> this space?
        </span>
      )
    },
    negativeText: "Cancel",
    positiveText: "Save",
    onPositiveClick: async () => {
      await dataManager.removeSpace(spacesStore.activeId)
      await spacesStore.fetchSpaces()
      await spacesStore.setActiveSpace(spacesStore.spaces[0].id)
      dialog.destroyAll()
    },
  })
}
</script>
