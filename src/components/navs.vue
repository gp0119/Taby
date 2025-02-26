<template>
  <div
    class="flex h-[50px] items-center justify-between border-0 border-b border-solid px-4 py-2.5 [&_.n\-base\-selection\-input]:!pl-1 [&_.n\-base\-selection\-input]:!pr-1"
  >
    <div class="flex items-center gap-4">
      <span class="shrink-0 select-none text-xl text-primary">{{ title }}</span>
      <div
        class="h-[30px] w-[220px] cursor-pointer select-none whitespace-nowrap rounded border bg-card-color px-2 text-xs leading-[30px] text-[#C2C2C2]"
        @click="openModal"
      >
        Press Ctrl/Command + F to search
      </div>
      <n-select
        size="small"
        v-model:value="innerSelectedTag"
        tag
        :options="tagsStore.collectionsTags"
        placeholder="Select a tag"
        value-field="id"
        label-field="title"
        :render-label="renderTagLabel"
        clearable
        class="w-[200px]"
      />
    </div>
    <n-space class="flex-shrink-0">
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
import { useTagsStore } from "@/store/tags.ts"
import { useThemeStore } from "@/store/theme.ts"
import { Add, Settings } from "@vicons/ionicons5"
import { Delete } from "@vicons/carbon"
import DataManager from "@/db"
import { SelectOption, SelectGroupOption } from "naive-ui"
import IconSelect from "./icon-select.vue"
import { useEventListener } from "@vueuse/core"
import { useSearchModal } from "@/hooks/useSearchModal"
const { themeColor, theme, setTheme } = useThemeStore()

const currentTheme = ref(theme)

const { openModal } = useSearchModal()
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

const dataManager = new DataManager()

onMounted(async () => {
  await tagsStore.fetchCollectionsTags()
})

const renderTagLabel = (option: SelectOption | SelectGroupOption) => {
  return (
    <n-tag
      size="small"
      color={{
        color: `${option.color}33`,
        textColor: option.color,
        borderColor: `${option.color}4A`,
      }}
    >
      {option.title}
    </n-tag>
  )
}

const innerSelectedTag = computed({
  get: () => tagsStore.selectedTagId,
  set: (value) => {
    tagsStore.setSelectedTagId(value)
  },
})

const dialog = useDialog()
function onAddCollection() {
  const formModel = ref({ title: "" })
  dialog.create({
    title: () => {
      return <span>Add Collection</span>
    },
    titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
    class: "bg-body-color",
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

const icon = computed(
  () =>
    spacesStore.spaces.find((item) => item.id === spacesStore.activeId)?.icon,
)

function onEditSpace() {
  const formModel = ref({ title: title.value, icon: icon.value })
  dialog.create({
    title: () => {
      return <span>Edit Space</span>
    },
    class: "bg-body-color",
    titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
    negativeText: "Cancel",
    positiveText: "Save",
    content: () => (
      <div>
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
      </div>
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
  dialog.error({
    title: "Delete Space",
    titleClass: "!text-text-primary",
    class: "bg-body-color",
    content: () => {
      return (
        <span class="text-text-primary">
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

const cleanup = useEventListener(window, "keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "f") {
    e.preventDefault()
    e.stopPropagation()
    console.log("openSearchModal")
    openModal()
  }
})

onUnmounted(() => {
  cleanup()
})
</script>
