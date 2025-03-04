<template>
  <select-wrapper :options="allSpaces" v-model="id">
    <template #action>
      <n-input-group>
        <IconSelect v-model:value="formModel.icon" />
        <n-input
          v-model:value="formModel.title"
          placeholder="create a new space"
        />
        <n-button secondary type="primary" @click="onAddSpace">
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
import SelectWrapper from "@components/select-wrapper.vue"
import { useSpacesStore } from "@/store/spaces.ts"
import { Add } from "@vicons/carbon"
import IconSelect from "@components/icon-select.vue"
import DataManager from "@/db"

const id = defineModel<number | null>("modelValue", {
  default: null,
})

const spacesStore = useSpacesStore()

const allSpaces = computed(() =>
  spacesStore.spaces.map((space) => ({
    label: space.title,
    value: space.id,
  })),
)

const formModel = ref({
  title: "",
  icon: "StorefrontOutline",
})

const dataManager = new DataManager()
const onAddSpace = async () => {
  if (formModel.value.title === "") return
  await dataManager.addSpace(formModel.value)
  formModel.value.title = ""
  await spacesStore.fetchSpaces()
}
</script>
