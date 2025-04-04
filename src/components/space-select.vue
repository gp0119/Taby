<template>
  <select-wrapper
    :options="allSpaces"
    :multiple="multiple"
    v-model="id"
    :placeholder="ft('select', 'space')"
  >
    <template #action>
      <n-input-group>
        <IconSelect v-model:value="formModel.icon" />
        <n-input
          v-model:value="formModel.title"
          :placeholder="ft('create', 'space')"
        />
        <n-button secondary type="primary" @click="onAddSpace">
          <template #icon>
            <n-icon :component="Add" />
          </template>
        </n-button>
      </n-input-group>
    </template>
  </select-wrapper>
</template>

<script setup lang="ts">
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import SelectWrapper from "@components/select-wrapper.vue"
import { useSpacesStore } from "@/store/spaces.ts"
import { Add } from "@vicons/carbon"
import IconSelect from "@components/icon-select.vue"
import dataManager from "@/db"

const { ft } = useHelpi18n()
const id = defineModel<number | null | number[]>("modelValue", {
  default: null,
})

withDefaults(
  defineProps<{
    multiple?: boolean
  }>(),
  {
    multiple: false,
  },
)

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

const onAddSpace = async () => {
  if (formModel.value.title === "") return
  await dataManager.addSpace(formModel.value)
  formModel.value.title = ""
  await spacesStore.fetchSpaces()
}
</script>
