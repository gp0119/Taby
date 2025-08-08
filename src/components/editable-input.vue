<script setup lang="ts">
import { ref, watch } from "vue"

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    default: "点击进行编辑",
  },
})

const emit = defineEmits(["update:modelValue"])

const isEditing = ref(false)
const inputValue = ref(props.modelValue)
const inputRef = ref<HTMLInputElement | null>(null)

watch(
  () => props.modelValue,
  (newValue) => {
    inputValue.value = newValue
  },
)

const startEditing = () => {
  isEditing.value = true
}

const handleAfterEnter = () => {
  inputRef.value?.select()
}

const save = () => {
  isEditing.value = false
  if (inputValue.value.trim() === "") {
    inputValue.value = props.modelValue // Revert if empty
  } else if (inputValue.value !== props.modelValue) {
    emit("update:modelValue", inputValue.value)
  }
}

const cancel = () => {
  isEditing.value = false
  inputValue.value = props.modelValue
}
</script>

<template>
  <div class="editable-input-container">
    <Transition
      name="fade"
      mode="out-in"
      enter-active-class="transition-opacity duration-200 ease-out"
      leave-active-class="transition-opacity duration-200 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      @after-enter="handleAfterEnter"
    >
      <span v-if="!isEditing" class="cursor-pointer" @click="startEditing">
        {{ modelValue || placeholder }}
      </span>
      <input
        v-else
        ref="inputRef"
        v-model="inputValue"
        class="w-full rounded-md bg-transparent outline-primary"
        @blur="save"
        @keyup.enter="save"
        @keyup.esc="cancel"
      />
    </Transition>
  </div>
</template>
