<template>
  <select-wrapper
    v-model="id"
    :options="allSpaces"
    :multiple="multiple"
    :placeholder="ft('select', 'space')"
    :render-label="renderLabel"
    @update:value="onUpdateValue"
  >
    <template v-if="addable" #action>
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

<script setup lang="tsx">
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import SelectWrapper from "@components/select-wrapper.vue"
import { useSpacesStore } from "@/store/spaces.ts"
import { Add } from "@vicons/carbon"
import IconSelect from "@components/icon-select.vue"
import dataManager from "@/db"
import { ICON_LIST } from "@/utils/constants.ts"
const { ft } = useHelpi18n()
const id = defineModel<number | null | number[]>("modelValue", {
  default: null,
})

withDefaults(
  defineProps<{
    multiple?: boolean
    addable?: boolean
  }>(),
  {
    multiple: false,
    addable: true,
  },
)

const spacesStore = useSpacesStore()

const allSpaces = computed(() =>
  spacesStore.spaces.map((space) => ({
    label: space.title,
    value: space.id,
    icon: space.icon,
  })),
)

const formModel = ref({
  title: "",
  icon: "StorefrontOutline",
})

const renderLabel = (option: any) => {
  return (
    <div class="flex items-center">
      <n-icon
        size="16"
        component={ICON_LIST[option.icon ?? "StorefrontOutline"]}
      />
      <span class="ml-1">{option.label}</span>
    </div>
  )
}

const onAddSpace = async () => {
  if (formModel.value.title === "") return
  await dataManager.addSpace(formModel.value)
  formModel.value.title = ""
  await spacesStore.fetchSpaces()
}

const emit = defineEmits<{
  (e: "update:value", value: number | null | number[]): void
}>()

const onUpdateValue = (value: number | null | number[]) => {
  emit("update:value", value)
}
</script>
