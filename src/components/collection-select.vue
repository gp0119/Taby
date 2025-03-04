<template>
  <select-wrapper v-model="id" :options="options">
    <template #action>
      <n-input-group>
        <n-input
          v-model:value="formModel.title"
          placeholder="create a new collection"
        />
        <n-button secondary type="primary" @click="onAddCollection">
          <template #icon>
            <n-icon>
              <Add />
            </n-icon>
          </template>
        </n-button>
      </n-input-group>
    </template>
  </select-wrapper>
</template>

<script setup lang="ts">
import { iOptions } from "@/type.ts"
import SelectWrapper from "@components/select-wrapper.vue"
import { useSpacesStore } from "@/store/spaces.ts"
import { Add } from "@vicons/carbon"
import DataManager from "@/db"

const props = defineProps<{
  spaceId: number
}>()
const id = defineModel<number | null>("modelValue", {
  default: null,
})
const spacesStore = useSpacesStore()
const options = ref<iOptions>([])
const formModel = ref({
  title: "",
})

async function getOptions(spaceId: number): Promise<iOptions> {
  const result = await spacesStore.fetchCollections(spaceId)
  return result.map((collection) => ({
    label: collection.title,
    value: collection.id,
  }))
}

watch(
  () => props.spaceId,
  async (newSpaceId) => {
    options.value = await getOptions(newSpaceId)
  },
  { immediate: true },
)

const dataManager = new DataManager()
const onAddCollection = async () => {
  if (formModel.value.title === "") return
  await dataManager.addCollection({
    title: formModel.value.title,
    spaceId: props.spaceId,
    labelIds: [],
  })
  formModel.value.title = ""
  options.value = await getOptions(props.spaceId)
}
</script>
