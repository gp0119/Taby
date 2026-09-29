<template>
  <n-popover
    :trigger="canHover ? 'hover' : 'click'"
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
            class="group/tag tag-option-item relative flex items-center justify-between rounded-md py-1.5 pl-2.5"
            :class="{
              'bg-hover-color': idx === activeIndex,
              'cursor-pointer pr-9': editingTag?.id !== tag.id,
              'pr-1.5': editingTag?.id === tag.id,
            }"
            @click="editingTag?.id !== tag.id && handleTagSelect(tag.id)"
            @mouseenter="canHover && (activeIndex = idx)"
          >
            <n-input-group
              v-if="editingTag?.id === tag.id"
              class="w-full min-w-0"
              @click.stop
            >
              <color-select v-model:value="editingTag.color" size="tiny" />
              <n-input
                v-model:value="editingTag.title"
                class="!w-0 min-w-0 flex-1"
                :placeholder="ft('placeholder', 'tag')"
                :aria-label="ft('title')"
                size="tiny"
                autofocus
                @keydown="onEditTagKeydown"
              />
              <n-button
                size="tiny"
                :aria-label="ft('save')"
                :disabled="!editingTag.title.trim()"
                @click="onSaveTag"
              >
                <template #icon>
                  <n-icon size="16" :component="Checkmark" />
                </template>
              </n-button>
              <n-button
                size="tiny"
                :aria-label="ft('cancel')"
                @click="onCancelEditTag"
              >
                <template #icon>
                  <n-icon size="16" :component="Close" />
                </template>
              </n-button>
              <DeletePopconfirm
                :show="deletingTagId === tag.id"
                :name="tag.title"
                :confirm="() => onDeleteTag(tag)"
                placement="left"
                @update:show="onUpdateDeleteTag($event, tag.id)"
              >
                <n-button
                  quaternary
                  size="tiny"
                  type="error"
                  :aria-label="ft('delete', 'tag')"
                  @click.stop
                >
                  <template #icon>
                    <n-icon size="14" :component="TrashOutline" />
                  </template>
                </n-button>
              </DeletePopconfirm>
            </n-input-group>
            <template v-else>
              <Tag :tag="tag" :closeable="false" />
              <n-icon
                v-if="item.labelIds.includes(tag.id)"
                class="text-primary"
                size="16"
                :component="Checkmark"
              />
              <div
                class="absolute right-1.5 hidden animate-scale-in items-center group-focus-within/tag:flex group-hover/tag:flex"
                :class="{ '!flex': !canHover }"
              >
                <n-button
                  quaternary
                  size="tiny"
                  type="primary"
                  :aria-label="ft('edit', 'tag')"
                  @click.stop="onEditTag(tag)"
                >
                  <template #icon>
                    <n-icon size="16" :component="TagEdit" />
                  </template>
                </n-button>
              </div>
            </template>
          </div>
        </div>
        <div
          v-else
          class="flex h-full flex-col items-center justify-center gap-y-2 !bg-card-color text-text-secondary"
        >
          <n-icon
            size="32"
            class="opacity-50"
            :component="TagNone"
            aria-hidden="true"
          />
          <span class="opacity-50">{{ ft("no-tags") }}</span>
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

<script setup lang="ts">
import { COLOR_LIST } from "@/utils/constants.ts"
import ColorSelect from "@components/color-select.vue"
import {
  TagGroup,
  TagNone,
  TagEdit,
  Checkmark,
  SaveAnnotation,
} from "@vicons/carbon"
import { Close, TrashOutline } from "@vicons/ionicons5"
import { useTagsStore } from "@/store/tags"
import { CollectionWithCards, Label } from "@/type"
import dataManager from "@/db"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import DeletePopconfirm from "@/components/delete-popconfirm.vue"
import Tag from "@/components/tag.vue"
import PopoverWrapper from "@/components/popover-wrapper.vue"
import type { InputInst } from "naive-ui"
import { useEventListener } from "@vueuse/core"
import { useCanHover } from "@/hooks/useCanHover"

const props = defineProps<{
  item: CollectionWithCards
}>()

const { ft } = useHelpi18n()
const canHover = useCanHover()
const tagsStore = useTagsStore()
const selectedColor = ref<string>(COLOR_LIST[0])
const newTag = ref({
  title: "",
})
const newTagInputRef = ref<InputInst | null>(null)
const deletingTagId = ref<number | null>(null)
const editingTag = ref<Label | null>(null)

const { isShowTagAction, setIsShowTagAction } = inject("isShowTagAction") as {
  isShowTagAction: Ref<boolean>
  setIsShowTagAction: (value: boolean) => void
}

const getRandomColor = () => {
  return COLOR_LIST[Math.floor(Math.random() * COLOR_LIST.length)]
}

function onUpdateDeleteTag(show: boolean, tagId: number) {
  deletingTagId.value = show ? tagId : null
  if (show) setIsShowTagAction(true)
}

const onUpdateShowTagAction = async (value: boolean) => {
  if (editingTag.value || (!value && deletingTagId.value !== null)) return
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
  newTag.value.title = ""
  await nextTick()
  activeIndex.value = filterTags.value.findIndex((tag) => tag.id === id)
  scrollActiveIntoView()
  focusNewTagInputSafely()
}

const addTagforCollection = async (id: number) => {
  await dataManager.addTagforCollection(props.item.id, id)
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

const onDeleteTag = async (tag: { id: number }) => {
  await dataManager.removeLabel(tag.id)
  await tagsStore.fetchTags()
  deletingTagId.value = null
  setIsShowTagAction(false)
}

const onEditTag = (tag: Label) => {
  deletingTagId.value = null
  editingTag.value = { ...tag }
}

const onCancelEditTag = () => {
  editingTag.value = null
  deletingTagId.value = null
  focusNewTagInputSafely()
}

const onSaveTag = async () => {
  if (!editingTag.value || !editingTag.value.title.trim()) return
  await tagsStore.updateTag(editingTag.value)
  onCancelEditTag()
}

const onEditTagKeydown = (event: KeyboardEvent) => {
  if (event.key !== "Enter" && event.key !== "Escape") return
  event.stopPropagation()
  event.preventDefault()
  if (event.key === "Enter") {
    onSaveTag()
  } else {
    onCancelEditTag()
  }
}

const searchFilterTag = (tag: { title?: string }) => {
  return (tag.title ?? "")
    .toLocaleLowerCase()
    .includes((newTag.value.title ?? "").trim().toLocaleLowerCase())
}

const filterTags = computed(() => {
  return tagsStore.tags.filter(
    (tag) => tag.id === editingTag.value?.id || searchFilterTag(tag),
  )
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
  if (editingTag.value || deletingTagId.value !== null) return
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
    } else {
      editingTag.value = null
      deletingTagId.value = null
      if (stopKeydown) {
        stopKeydown()
        stopKeydown = null
      }
    }
  },
  { immediate: true },
)
</script>
