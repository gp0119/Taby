<template>
  <n-popover
    trigger="hover"
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
        class="min-w-[180px] justify-start !shadow-btn-shadow [&_.n-button\_\_content]:!w-full"
      >
        <template #icon>
          <n-icon size="20">
            <TagGroup v-if="tagsStore.selectedTagIds.length < 2" />
            <template v-else>
              <ShapeIntersect20Regular
                v-if="tagsStore.tagFilterType === 'AND'"
              />
              <ShapeUnion20Regular v-else />
            </template>
          </n-icon>
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
          class="scrollbar-thin max-h-[60vh] overflow-auto"
        >
          <div
            v-for="tag in filterTagOptions"
            :key="tag.id"
            class="flex cursor-pointer select-none items-center justify-between gap-x-2 px-4 py-2 hover:bg-hover-color"
            :class="{
              'bg-hover-color': tagsStore.selectedTagIds.includes(tag.id),
            }"
            @click="handleTagSelect(tag.id, tag)"
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

const filterTag = ref({
  title: "",
})
const tagsStore = useTagsStore()
const { ft } = useHelpi18n()

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
    return
  }
  tagsStore.addSelectedTag(option)
}

const onUpdateShow = async (show: boolean) => {
  if (show) {
    await tagsStore.fetchCollectionsTags()
  }
  tagsStore.toggleTagOpen(show)
}
const searchFilterTag = (tag: { title?: string }) => {
  return (tag.title ?? "")
    .toLocaleLowerCase()
    .includes((filterTag.value.title ?? "").trim().toLocaleLowerCase())
}

const filterTagOptions = computed(() => {
  return tagOptions.value.filter((tag) => searchFilterTag(tag))
})
</script>
