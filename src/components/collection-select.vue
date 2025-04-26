<template>
  <select-wrapper
    v-model="id"
    :options="options"
    :placeholder="ft('select', 'collection')"
  >
    <template #action>
      <n-input-group>
        <n-input
          v-model:value="formModel.title"
          :placeholder="ft('create', 'collection')"
        />
        <n-button secondary type="primary" @click="onAddCollection">
          <template #icon>
            <n-icon :component="Add" />
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
import dataManager from "@/db"
import { useHelpi18n } from "@/hooks/useHelpi18n"

const { ft } = useHelpi18n()
const props = defineProps<{
  spaceId: string
}>()
const id = defineModel<string | null>("modelValue", {
  default: null,
})
const spacesStore = useSpacesStore()
const options = ref<iOptions>([])
const formModel = ref({
  title: "",
})

async function getOptions(spaceId: string): Promise<iOptions> {
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
