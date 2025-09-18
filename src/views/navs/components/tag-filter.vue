<template>
  <n-popover
    trigger="click"
    placement="bottom-start"
    :show-arrow="false"
    :show="tagsStore.isTagOpen"
    style="padding: 0"
    @select="handleTagSelect"
    @update:show="onUpdateShow"
  >
    <template #trigger>
      <n-button
        tertiary
        :focusable="false"
        size="small"
        class="min-w-[180px] justify-start !shadow-btn-shadow [&_.n-button__content]:!w-full"
      >
        <template #icon>
          <PopoverWrapper :message="tagFilterTooltip" placement="bottom-start">
            <n-icon size="20">
              <TagGroup v-if="tagsStore.selectedTagIds.length < 2" />
              <template v-else>
                <ShapeIntersect20Regular
                  v-if="tagsStore.tagFilterType === 'AND'"
                />
                <ShapeUnion20Regular v-else />
              </template>
            </n-icon>
          </PopoverWrapper>
        </template>
        <div
          class="flex w-full max-w-[250px] flex-nowrap items-center justify-between"
        >
          <template v-if="tagsStore.selectedTags.length">
            <div class="scrollbar-none flex flex-1 justify-start overflow-auto">
              <Tag
                v-for="tag in tagsStore.selectedTags"
                :key="tag.id"
                :tag="tag"
                removeable
                class="mr-1 inline-flex"
                @remove="tagsStore.removeSelectedTag(tag)"
              />
            </div>
            <div class="pl-2" @click="tagsStore.resetSelectedTag">
              <n-icon-wrapper
                border-radius="10"
                icon-color="#fff"
                size="14"
                class="block bg-gray-500"
              >
                <n-icon :component="Close" />
              </n-icon-wrapper>
            </div>
          </template>
          <template v-else>
            <div class="leading-6">
              {{ ft("tag-filter") }}
            </div>
          </template>
        </div>
      </n-button>
    </template>
    <template #default>
      <div
        class="flex min-w-[150px] flex-col overflow-hidden rounded-lg bg-dialog-color"
      >
        <div
          class="flex flex-col gap-y-2 border-b border-solid border-border-color px-4 py-2"
        >
          <div class="flex items-center gap-x-2">
            <n-tag
              size="small"
              class="flex-1 cursor-pointer justify-center"
              :type="tagsStore.tagFilterType === 'AND' ? 'success' : 'default'"
              @click="tagsStore.setTagFilterType('AND')"
            >
              <span class="text-text-secondary">AND</span>
              <template #icon>
                <n-icon :component="ShapeIntersect20Regular" />
              </template>
            </n-tag>
            <n-tag
              size="small"
              class="flex-1 cursor-pointer justify-center"
              :type="tagsStore.tagFilterType === 'OR' ? 'success' : 'default'"
              @click="tagsStore.setTagFilterType('OR')"
            >
              <span class="text-text-secondary">OR</span>
              <template #icon>
                <n-icon :component="ShapeUnion20Regular" />
              </template>
            </n-tag>
          </div>
          <n-input
            ref="searchInputRef"
            v-model:value="filterTag.title"
            class="max-w-[150px]"
            :placeholder="ft('search-tag')"
            size="tiny"
            maxlength="10"
          >
            <template #prefix>
              <n-icon :component="SearchOutline" />
            </template>
          </n-input>
        </div>

        <div
          v-if="filterTagOptions.length > 0"
          ref="listRef"
          class="scrollbar-thin max-h-[60vh] overflow-auto"
        >
          <div
            v-for="(tag, idx) in filterTagOptions"
            :key="tag.id"
            class="tag-option-item flex cursor-pointer select-none items-center justify-between gap-x-2 px-4 py-2"
            :class="{
              'bg-hover-color': idx === activeIndex,
            }"
            @click="handleTagSelect(tag.id, tag)"
            @mouseenter="activeIndex = idx"
          >
            <Tag :tag="tag" />
            <n-icon
              v-if="tagsStore.selectedTagIds.includes(tag.id)"
              class="text-primary"
              size="14"
              :component="Checkmark"
            />
          </div>
        </div>
        <div
          v-else
          class="!bg-card-color py-2.5 text-center text-text-secondary"
        >
          {{ ft("no-tags") }}
        </div>
      </div>
    </template>
  </n-popover>
</template>

<script setup lang="tsx">
import { useTagsStore } from "@/store/tags.ts"
import { TagGroup, Checkmark, Close } from "@vicons/carbon"
import { ShapeUnion20Regular, ShapeIntersect20Regular } from "@vicons/fluent"
import { SearchOutline } from "@vicons/ionicons5"
import { Label } from "@/type"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import Tag from "@/components/tag.vue"
import type { InputInst } from "naive-ui"
import { useSettingStore } from "@/store/setting"
import { useShortcutHotkeys } from "@/hooks/useShortcutHotkeys"
import { useEventListener } from "@vueuse/core"
import PopoverWrapper from "@/components/popover-wrapper.vue"

const searchInputRef = ref<InputInst | null>(null)
const filterTag = ref({
  title: "",
})
const tagsStore = useTagsStore()
const { ft, ft2 } = useHelpi18n()

const settingStore = useSettingStore()
const shortcutsSetting = computed(() =>
  settingStore.getSetting("shortcutSettings"),
)
const tagFilterTooltip = computed(() => {
  const combo = shortcutsSetting.value?.openTagFilter
  return combo ? ft2("open-tag-filter-hint", { combo }) : ft("tag-filter")
})

const tagOptions = computed(() => {
  const options = tagsStore.collectionsTags.map((tag) => ({
    ...tag,
    title: tag.title,
    key: tag.id,
    color: tag.color,
  }))
  return options
})

const handleTagSelect = (_key: number, option: Label) => {
  if (tagsStore.selectedTagIds.includes(option.id)) {
    tagsStore.removeSelectedTag(option)
  } else {
    tagsStore.addSelectedTag(option)
  }
  filterTag.value.title = ""
  nextTick(() => {
    const idx = filterTagOptions.value.findIndex((t) => t.id === option.id)
    if (idx >= 0) {
      activeIndex.value = idx
      scrollActiveIntoView()
    }
    focusSearchInputSafely()
  })
}

const onUpdateShow = async (show: boolean) => {
  tagsStore.toggleTagOpen(show)
  if (show) {
    await tagsStore.fetchCollectionsTags()
    tagsStore.toggleTagOpen(show)
    await focusSearchInputSafely()
  }
}

const focusSearchInputSafely = async () => {
  await nextTick()
  searchInputRef.value?.focus()
}
const searchFilterTag = (tag: { title?: string }) => {
  return (tag.title ?? "")
    .toLocaleLowerCase()
    .includes((filterTag.value.title ?? "").trim().toLocaleLowerCase())
}

const filterTagOptions = computed(() => {
  return tagOptions.value.filter((tag) => searchFilterTag(tag))
})

const toggleTagFilter = () => {
  onUpdateShow(!tagsStore.isTagOpen)
}

const shortcuts = computed(() => [
  {
    shortcut: shortcutsSetting.value?.openTagFilter,
    handler: () => toggleTagFilter(),
  },
])
useShortcutHotkeys(shortcuts)

const activeIndex = ref(0)

watch(
  () => filterTag.value.title,
  () => {
    activeIndex.value = 0
  },
)

const moveActive = (delta: number) => {
  const total = filterTagOptions.value.length
  if (total === 0) return
  activeIndex.value = (activeIndex.value + delta + total) % total
  scrollActiveIntoView()
}

const trySelectActive = () => {
  const total = filterTagOptions.value.length
  if (total === 0) return
  const tag = filterTagOptions.value[activeIndex.value]
  if (tag) {
    handleTagSelect(tag.id, tag as any)
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
  () => tagsStore.isTagOpen,
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
