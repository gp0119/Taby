import dataManager from "@/db"
import { useSpacesStore } from "@/store/spaces.ts"
import { Label } from "@/type"
import { useToggle } from "@vueuse/core"
import { defineStore } from "pinia"

export const useTagsStore = defineStore("tags", () => {
  const spacesStore = useSpacesStore()
  const tags = ref<Label[]>([])
  const collectionsTags = ref<Label[]>([])

  const selectedTags = ref<Label[]>([])
  const tagFilterType = ref<"AND" | "OR" | null>("AND")
  const [isTagOpen, toggleTagOpen] = useToggle()

  async function fetchTags() {
    tags.value = await dataManager.getLabels()
  }

  async function addTag(tag: Omit<Label, "id">) {
    const id = await dataManager.addLabel(tag.title, tag.color)
    await fetchTags()
    return id
  }

  async function addSelectedTag(tag: Label) {
    selectedTags.value.push(tag)
  }

  async function removeSelectedTag(tag: Label) {
    selectedTags.value = selectedTags.value.filter((item) => item.id !== tag.id)
  }

  const selectedTagIds = computed(() => {
    return selectedTags.value.map((item) => item.id)
  })

  async function removeTag(tag: Label) {
    await dataManager.removeLabel(tag.id)
    await fetchTags()
  }

  async function updateTag(tag: Label) {
    await dataManager.updateLabel(tag.id, tag.title, tag.color)
    await fetchTags()
  }

  async function fetchCollectionsTags() {
    const collectionsTagIds = new Map<number, Label>()
    spacesStore.collections.forEach((collection) => {
      collection.labels.forEach((label) => {
        collectionsTagIds.set(label.id, label)
      })
    })
    collectionsTags.value = Array.from(collectionsTagIds.values())
  }

  function resetSelectedTag() {
    selectedTags.value = []
  }

  function setTagFilterType(type: "AND" | "OR" | null) {
    tagFilterType.value = type
  }

  return {
    tags,
    fetchTags,
    addTag,
    removeTag,
    updateTag,
    collectionsTags,
    fetchCollectionsTags,
    isTagOpen,
    toggleTagOpen,
    resetSelectedTag,
    tagFilterType,
    setTagFilterType,
    selectedTags,
    addSelectedTag,
    removeSelectedTag,
    selectedTagIds,
  }
})
