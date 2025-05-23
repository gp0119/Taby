import dataManager from "@/db"
import { useSpacesStore } from "@/store/spaces.ts"
import { Label } from "@/type"
import { useToggle } from "@vueuse/core"
import { defineStore } from "pinia"

export const useTagsStore = defineStore("tags", () => {
  const spacesStore = useSpacesStore()
  const tags = ref<Label[]>([])
  const collectionsTags = ref<Label[]>([])
  const selectedTag = ref<Label | null>(null)
  const [isTagOpen, toggleTagOpen] = useToggle()

  async function fetchTags() {
    tags.value = await dataManager.getLabels()
  }

  async function addTag(tag: Omit<Label, "id">) {
    await dataManager.addLabel(tag.title, tag.color)
    await fetchTags()
  }

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

  function setSelectedTag(tag: Label | null) {
    selectedTag.value = tag
  }

  function resetSelectedTag() {
    selectedTag.value = null
  }

  return {
    tags,
    fetchTags,
    addTag,
    removeTag,
    updateTag,
    collectionsTags,
    fetchCollectionsTags,
    selectedTag,
    setSelectedTag,
    isTagOpen,
    toggleTagOpen,
    resetSelectedTag,
  }
})
