import { defineStore } from "pinia"
import { Label } from "@/type"
import DataManager from "@/db"

export const useTagsStore = defineStore("tags", () => {
  const dataManager = new DataManager()
  const tags = ref<Label[]>([])

  async function fetchTags() {
    const fetchedTags = await dataManager.getLabels()
    tags.value = fetchedTags
  }

  async function addTag(tag: Label) {
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

  return {
    tags,
    fetchTags,
    addTag,
    removeTag,
    updateTag,
  }
})
