import DataManager from "@/db"
import { useSpacesStore } from "@/store/spaces.ts"
import { Label } from "@/type"
import { useToggle } from "@vueuse/core"
import { defineStore } from "pinia"

export const useTagsStore = defineStore("tags", () => {
  const dataManager = new DataManager()
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
    const allTags = await dataManager.getLabels()
    const collections = await spacesStore.fetchCollections(spacesStore.activeId)
    const collectionsTagIds = new Set()
    collections.forEach((collection) => {
      collection.labelIds.forEach((labelId) => {
        collectionsTagIds.add(labelId)
      })
    })
    collectionsTags.value = allTags.filter((tag) =>
      collectionsTagIds.has(tag.id),
    )
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
