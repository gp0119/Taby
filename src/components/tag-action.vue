<template>
  <n-popover
    trigger="hover"
    placement="bottom-end"
    :show-arrow="false"
    :to="false"
    class="min-w-[150px]"
  >
    <template #trigger>
      <n-icon
        size="20"
        title="Tag"
        :component="TagGroup"
        class="mx-1.5 cursor-pointer text-primary"
      />
    </template>
    <template #header>
      <n-text depth="1">
        <span class="text-text-primary">Tags</span>
      </n-text>
    </template>
    <n-scrollbar
      class="max-h-[300px]"
      @mouseenter="setIsHoverTag(true)"
      @mouseleave="setIsHoverTag(false)"
    >
      <n-space vertical v-if="tagsStore.tags.length > 0">
        <div
          class="group/tag flex items-center justify-between"
          v-for="tag in tagsStore.tags"
          :key="tag.id"
        >
          <n-tag
            size="small"
            :color="{
              color: `${tag.color}33`,
              textColor: tag.color,
              borderColor: `${tag.color}4A`,
            }"
            @click="addTagforCollection(tag.id)"
            >{{ tag.title }}</n-tag
          >
          <n-icon
            size="16"
            class="ml-1 mr-4 hidden cursor-pointer text-primary group-hover/tag:block"
            title="Edit Collection"
            :component="Edit"
            @click="onEditTag(tag)"
          />
        </div>
      </n-space>
      <div v-else class="!bg-card-color text-center text-text-secondary">
        No tags
      </div>
    </n-scrollbar>
    <template #footer>
      <div>
        <n-input
          class="w-full"
          v-model:value="newTag.title"
          placeholder="Add tag"
          size="tiny"
          maxlength="10"
        />
      </div>
      <div class="mt-2 flex items-center gap-1">
        <n-tag
          class="h-[20px] flex-1 cursor-pointer select-none"
          @click="pickColor"
          size="small"
          :color="{
            color: `${tabColors[colorIndex]}33`,
            textColor: tabColors[colorIndex],
            borderColor: `${tabColors[colorIndex]}4A`,
          }"
          >change color</n-tag
        >
        <n-button size="tiny" @click="addTag">
          <template #icon>
            <n-icon :component="Checkmark"></n-icon>
          </template>
        </n-button>
      </div>
    </template>
  </n-popover>
</template>

<script setup lang="tsx">
import { TagGroup, Edit, Checkmark, Delete } from "@vicons/carbon"
import { useTagsStore } from "@/store/tags"
import { CollectionWithCards } from "@/type"
import DataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh"
const props = defineProps<{
  item: CollectionWithCards
}>()

const dataManager = new DataManager()
const { refreshCollections } = useRefresh()

const tagsStore = useTagsStore()
const colorIndex = ref(0)
const tabColors = [
  "#219ebc",
  "#606c38",
  "#e63946",
  "#f72585",
  "#457b9d",
  "#3a0ca3",
  "#4361ee",
  "#264653",
  "#2a9d8f",
  "#7209b7",
  "#f4a261",
  "#e76f51",
]
const newTag = ref({
  title: "",
})

const { setIsHoverTag } = inject("isHoverTag") as {
  isHoverTag: boolean
  setIsHoverTag: (value: boolean) => void
}

onMounted(async () => {
  await tagsStore.fetchTags()
})
const addTag = () => {
  if (newTag.value.title === "") return
  tagsStore.addTag({
    title: newTag.value.title,
    color: tabColors[colorIndex.value],
  })
  newTag.value.title = ""
  colorIndex.value = 0
}
const addTagforCollection = async (id: number) => {
  await dataManager.addTagforCollection(props.item.id, id)
  await refreshCollections()
}
const pickColor = () => {
  colorIndex.value = (colorIndex.value + 1) % tabColors.length
}

const dialog = useDialog()
const onDeleteTag = async (id: number) => {
  dialog.error({
    title: "Delete Tag",
    content: "Are you sure you want to delete this tag?",
    titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
    class: "!bg-body-color",
    negativeText: "Cancel",
    positiveText: "Save",
    onPositiveClick: async () => {
      await dataManager.removeLabel(id)
      await tagsStore.fetchTags()
      await refreshCollections()
      dialog.destroyAll()
    },
  })
}
const onEditTag = (tag: { id: number; title: string }) => {
  const formModel = ref({ title: tag.title })
  dialog.create({
    title: "Edit Tag",
    titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
    class: "bg-body-color",
    negativeText: "Cancel",
    positiveText: "Save",
    content: () => (
      <div>
        <n-form model={formModel.value}>
          <n-form-item label="Title">
            <n-input v-model:value={formModel.value.title} />
          </n-form-item>
        </n-form>
        <n-button
          size="small"
          secondary
          type="error"
          onClick={() => onDeleteTag(tag.id)}
          v-slots={{
            icon: () => (
              <n-icon>
                <Delete />
              </n-icon>
            ),
          }}
        >
          <span>DELETE</span>
        </n-button>
      </div>
    ),
    onPositiveClick: async () => {
      await dataManager.updateLabel(tag.id, formModel.value.title)
      await tagsStore.fetchTags()
      await refreshCollections()
    },
  })
}
</script>

<style scoped></style>
