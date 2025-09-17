<template>
  <n-popover
    trigger="hover"
    placement="bottom-end"
    :show-arrow="false"
    class="min-w-[150px]"
    content-style="padding: 0;"
    :show="isShowTagAction"
    @update:show="onUpdateShowTagAction"
  >
    <template #trigger>
      <n-button quaternary size="small" class="w-[28px]">
        <template #icon>
          <n-icon size="18" :component="TagGroup" />
        </template>
      </n-button>
    </template>
    <template #header>
      <n-text depth="1">
        <span class="font-bold text-text-primary">{{ ft("tags") }}</span>
      </n-text>
    </template>
    <template #default>
      <div class="scrollbar-thin h-[500px] overflow-y-auto px-2">
        <div
          v-if="filterTags.length > 0"
          ref="listRef"
          class="flex flex-col gap-y-1 py-1"
        >
          <div
            v-for="(tag, idx) in filterTags"
            :key="tag.id"
            class="group/tag tag-option-item relative flex cursor-pointer items-center justify-between rounded-md py-1.5 pl-2.5 pr-14 hover:bg-hover-color"
            :class="{
              'bg-hover-color': idx === activeIndex,
            }"
            @click="handleTagSelect(tag.id)"
          >
            <Tag :tag="tag" :closeable="false" />
            <n-icon
              v-if="item.labelIds.includes(tag.id)"
              class="text-primary"
              size="16"
              :component="Checkmark"
            />
            <div
              class="absolute right-1.5 hidden items-center gap-x-2 group-hover/tag:flex"
            >
              <PopoverWrapper :message="ft('edit', 'tag')">
                <n-icon
                  size="16"
                  :component="TagEdit"
                  class="cursor-pointer text-primary"
                  @click.stop="onEditTag(tag)"
                />
              </PopoverWrapper>
              <PopoverWrapper :message="ft('delete', 'tag')">
                <n-icon
                  size="16"
                  :component="Delete"
                  class="cursor-pointer text-error-color"
                  @click.stop="onDeleteTag(tag)"
                />
              </PopoverWrapper>
            </div>
          </div>
        </div>
        <div
          v-else
          class="flex h-full items-center justify-center !bg-card-color text-text-secondary"
        >
          {{ ft("no-tags") }}
        </div>
      </div>
    </template>
    <template #footer>
      <n-input-group>
        <color-select v-model:value="selectedColor" size="tiny" />
        <n-input
          ref="newTagInputRef"
          v-model:value="newTag.title"
          class="!w-[140px]"
          :placeholder="ft('placeholder', 'tag')"
          size="tiny"
          maxlength="10"
        />
        <n-button size="tiny" @click="saveAndAddTag">
          <template #icon>
            <PopoverWrapper :message="ft('save-and-add-tag')" placement="top">
              <n-icon :component="SaveAnnotation" />
            </PopoverWrapper>
          </template>
        </n-button>
        <n-button size="tiny" @click="addTag">
          <template #icon>
            <PopoverWrapper :message="ft('save-tag')" placement="top">
              <n-icon :component="Checkmark" />
            </PopoverWrapper>
          </template>
        </n-button>
      </n-input-group>
    </template>
  </n-popover>
</template>

<script setup lang="tsx">
import { COLOR_LIST } from "@/utils/constants.ts"
import ColorSelect from "@components/color-select.vue"
import {
  TagGroup,
  TagEdit,
  Checkmark,
  Delete,
  SaveAnnotation,
} from "@vicons/carbon"
import { useTagsStore } from "@/store/tags"
import { CollectionWithCards } from "@/type"
import dataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useEditDialog } from "@/hooks/useEditDialog"
import { useDeleteDialog } from "@/hooks/useDeleteDialog"
import Tag from "@/components/tag.vue"
import PopoverWrapper from "@/components/popover-wrapper.vue"
import type { InputInst } from "naive-ui"
import { useEventListener } from "@vueuse/core"

const props = defineProps<{
  item: CollectionWithCards
}>()

const { refreshCollections } = useRefresh()
const { ft, gt } = useHelpi18n()
const tagsStore = useTagsStore()
const selectedColor = ref<string>(COLOR_LIST[0])
const newTag = ref({
  title: "",
})
const newTagInputRef = ref<InputInst | null>(null)

const { isShowTagAction, setIsShowTagAction } = inject("isShowTagAction") as {
  isShowTagAction: Ref<boolean>
  setIsShowTagAction: (value: boolean) => void
}

const getRandomColor = () => {
  return COLOR_LIST[Math.floor(Math.random() * COLOR_LIST.length)]
}

const onUpdateShowTagAction = async (value: boolean) => {
  setIsShowTagAction(value)
  if (value) {
    selectedColor.value = getRandomColor()
    newTag.value.title = ""
    await nextTick()
    focusNewTagInputSafely()
  }
}

onMounted(async () => {
  await tagsStore.fetchTags()
})
const addTag = async () => {
  if (newTag.value.title === "") return
  await tagsStore.addTag({
    title: newTag.value.title,
    color: selectedColor.value,
  })
  newTag.value.title = ""
  await nextTick()
  activeIndex.value = filterTags.value.length - 1
  scrollActiveIntoView()
  selectedColor.value = getRandomColor()
  focusNewTagInputSafely()
}

async function handleTagSelect(id: number) {
  if (props.item.labelIds.includes(id)) {
    await dataManager.removeTagforCollection(props.item.id, id)
  } else {
    await dataManager.addTagforCollection(props.item.id, id)
  }
  await refreshCollections()
  newTag.value.title = ""
  await nextTick()
  activeIndex.value = filterTags.value.findIndex((tag) => tag.id === id)
  scrollActiveIntoView()
  focusNewTagInputSafely()
}

const addTagforCollection = async (id: number) => {
  await dataManager.addTagforCollection(props.item.id, id)
  await refreshCollections()
}

const saveAndAddTag = async () => {
  if (newTag.value.title === "") return
  const tagId = await tagsStore.addTag({
    title: newTag.value.title,
    color: selectedColor.value,
  })
  newTag.value.title = ""
  selectedColor.value = getRandomColor()
  await addTagforCollection(tagId)
  await focusNewTagInputSafely()
  await nextTick()
  activeIndex.value = filterTags.value.length - 1
  scrollActiveIntoView()
}

const { open: openEditDialog } = useEditDialog()
const { open: openDeleteDialog } = useDeleteDialog()
const onDeleteTag = async (tag: {
  id: number
  title: string
  color: string
}) => {
  openDeleteDialog({
    title: ft("delete", "tag"),
    content: () => (
      <span
        class="text-text-primary"
        v-html={gt("delete-confirm", tag.title)}
      />
    ),
    onPositiveClick: async () => {
      await dataManager.removeLabel(tag.id)
      await tagsStore.fetchTags()
      await refreshCollections()
    },
  })
}
const onEditTag = (tag: { id: number; title: string; color: string }) => {
  const formModel = ref({ title: tag.title, color: tag.color })
  openEditDialog({
    title: ft("edit", "tag"),
    renderContent: () => (
      <n-form model={formModel.value}>
        <n-form-item label={`${ft("title")}:`} class="!mb-1">
          <n-input-group>
            <color-select v-model:value={formModel.value.color} />
            <n-input
              v-model:value={formModel.value.title}
              placeholder={ft("placeholder", "tag")}
            />
            <n-button
              ghost
              type="error"
              onClick={() => onDeleteTag(tag)}
              v-slots={{
                icon: () => <n-icon size="16" component={Delete} />,
              }}
            />
          </n-input-group>
        </n-form-item>
      </n-form>
    ),
    onPositiveClick: async () => {
      await dataManager.updateLabel(
        tag.id,
        formModel.value.title,
        formModel.value.color,
      )
      await tagsStore.fetchTags()
      await refreshCollections()
    },
  })
}
const searchFilterTag = (tag: { title?: string }) => {
  return (tag.title ?? "")
    .toLocaleLowerCase()
    .includes((newTag.value.title ?? "").trim().toLocaleLowerCase())
}

const filterTags = computed(() => {
  return tagsStore.tags.filter((tag) => searchFilterTag(tag))
})
const focusNewTagInputSafely = async () => {
  await nextTick()
  newTagInputRef.value?.focus()
}

const activeIndex = ref(0)

watch(
  () => newTag.value.title,
  () => {
    activeIndex.value = 0
  },
)

const moveActive = (delta: number) => {
  const total = filterTags.value.length
  if (total === 0) return
  activeIndex.value = (activeIndex.value + delta + total) % total
  scrollActiveIntoView()
}

const trySelectActive = async () => {
  const total = filterTags.value.length
  if (total === 0) {
    await saveAndAddTag()
    return
  }
  const tag = filterTags.value[activeIndex.value]
  if (tag) {
    handleTagSelect(tag.id)
  }
}

const listRef = ref<HTMLElement | null>(null)
const scrollActiveIntoView = async () => {
  await nextTick()
  const el = listRef.value
  if (!el) return
  const items = el.querySelectorAll<HTMLElement>(".tag-option-item")
  const target = items[activeIndex.value]
  if (target) target.scrollIntoView({ block: "nearest" })
}

let stopKeydown: null | (() => void) = null
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "ArrowDown") {
    e.preventDefault()
    e.stopPropagation()
    moveActive(1)
  } else if (e.key === "ArrowUp") {
    e.preventDefault()
    e.stopPropagation()
    moveActive(-1)
  } else if (e.key === "Enter") {
    e.preventDefault()
    e.stopPropagation()
    trySelectActive()
  }
}

watch(
  () => isShowTagAction.value,
  (open) => {
    if (open) {
      activeIndex.value = 0
      stopKeydown = useEventListener(window, "keydown", onKeydown, {
        capture: true,
      })
    } else if (stopKeydown) {
      stopKeydown()
      stopKeydown = null
    }
  },
  { immediate: true },
)
</script>
