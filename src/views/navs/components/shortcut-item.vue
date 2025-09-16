<template>
  <div
    ref="rootEl"
    class="flex w-full cursor-pointer items-center justify-between px-4 py-2"
  >
    <div class="w-full select-none">
      <div>{{ title }}</div>
      <div class="mt-1.5 flex items-center justify-between gap-x-2">
        <div
          ref="recordAreaEl"
          class="relative flex flex-1 items-center justify-start gap-x-1 rounded-md border border-transparent bg-hover-color px-4 py-1.5 transition-shadow hover:shadow-hover-shadow"
          :class="{
            '!border-primary': isRecording,
          }"
          @click="onRecordShortcut"
        >
          <template v-if="isRecording">
            <span class="text-text-secondary">
              {{ ft("typing-shortcut") }}
            </span>
          </template>
          <template v-else>
            <template v-if="!value">
              <span class="text-text-secondary">not set</span>
            </template>
            <template v-else>
              <template v-for="key in keys" :key="key">
                <n-icon
                  v-if="SHORTCUT_ICON_MAP[key]"
                  :component="SHORTCUT_ICON_MAP[key]"
                  size="14"
                />
                <span v-else>
                  {{ key.toUpperCase() }}
                </span>
              </template>
            </template>
          </template>
          <div
            v-if="isRecording && hintText"
            class="absolute left-0 top-full mt-1 text-xs text-error-color"
          >
            {{ hintText }}
          </div>
        </div>
        <PopoverWrapper :message="ft('clear-shortcut')" placement="top">
          <n-button tertiary size="small" class="w-[28px]" @click="onClear">
            <template #icon>
              <n-icon :component="Close" size="12" />
            </template>
          </n-button>
        </PopoverWrapper>
        <PopoverWrapper :message="ft('reset-shortcut')" placement="top">
          <n-button tertiary size="small" class="w-[28px]" @click="onReset">
            <template #icon>
              <n-icon :component="Reset" size="12" />
            </template>
          </n-button>
        </PopoverWrapper>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Reset } from "@vicons/carbon"
import { Close } from "@vicons/ionicons5"
import { useEventListener, onClickOutside } from "@vueuse/core"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { watch } from "vue"
import PopoverWrapper from "@/components/popover-wrapper.vue"
import { SHORTCUT_ICON_MAP } from "@/utils/constants"

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(["update:value", "reset", "clear"])

const keys = computed(() => {
  return props.value ? props.value.split("+") : [""]
})

const isRecording = ref(false)

const onRecordShortcut = () => {
  isRecording.value = true
  currentMods.value = []
}

const onReset = () => {
  emit("reset")
}

const onClear = () => {
  emit("clear")
}

const isModifierKey = (key) => ["Control", "Shift", "Alt", "Meta"].includes(key)

const currentMods = ref([])
const computeModsFromEvent = (e) => {
  const mods = []
  if (e.metaKey) mods.push("Cmd")
  if (e.ctrlKey) mods.push("Ctrl")
  if (e.shiftKey) mods.push("Shift")
  if (e.altKey) mods.push("Alt")
  return mods
}

const { ft } = useHelpi18n()

const letterPressed = ref(false)
const hintText = computed(() => {
  if (!isRecording.value) return ""
  if (letterPressed.value && currentMods.value.length === 0)
    return ft("shortcut-need-mod-keys")
  if (!letterPressed.value && currentMods.value.length > 0)
    return ft("shortcut-need-letter")
  return ""
})

const normalizeKey = (key) => {
  if (key.length === 1) return key.toUpperCase()
  const map = {
    " ": "Space",
    Escape: "Esc",
    ArrowLeft: "Left",
    ArrowRight: "Right",
    ArrowUp: "Up",
    ArrowDown: "Down",
    Enter: "Enter",
    Backspace: "Backspace",
    Delete: "Delete",
    Tab: "Tab",
  }
  return map[key] || key
}

useEventListener(window, "keydown", (e) => {
  console.log("e: ", e)
  if (!isRecording.value) return
  // 仅在录制时拦截，避免触发浏览器默认快捷键
  if (e.preventDefault) e.preventDefault()
  if (e.stopPropagation) e.stopPropagation()

  if (e.key === "Escape") {
    isRecording.value = false
    letterPressed.value = false
    return
  }

  currentMods.value = computeModsFromEvent(e)

  if (isModifierKey(e.key)) return

  const parts = []
  if (e.ctrlKey || e.metaKey) parts.push("Ctrl")
  if (e.shiftKey) parts.push("Shift")
  if (e.altKey) parts.push("Alt")

  const finalKey = normalizeKey(e.key)
  // 规则限制：Ctrl/Cmd 必须存在；末键必须是单个字母 A-Z
  const isLetter = finalKey.length === 1 && /[A-Z]/.test(finalKey)
  const hasModifier = e.ctrlKey || e.metaKey || e.shiftKey || e.altKey
  if (!isLetter || !hasModifier) {
    // 不符合要求则继续等待；如果先按了字母，给出提示
    if (isLetter && !hasModifier) letterPressed.value = true
    return
  }

  parts.push(finalKey)

  const combo = parts.join("+")
  emit("update:value", combo)
  isRecording.value = false
  letterPressed.value = false
})

useEventListener(window, "keyup", (e) => {
  if (!isRecording.value) return
  currentMods.value = computeModsFromEvent(e)
  if (currentMods.value.length > 0) letterPressed.value = false
})

const rootEl = ref(null)
const recordAreaEl = ref(null)
let stopOnClickOutside = null
const handleClickOutside = () => {
  if (!isRecording.value) return
  isRecording.value = false
  letterPressed.value = false
}
watch(
  isRecording,
  (active) => {
    if (active) {
      stopOnClickOutside = onClickOutside(recordAreaEl, handleClickOutside)
    } else if (stopOnClickOutside) {
      stopOnClickOutside()
      stopOnClickOutside = null
    }
  },
  { immediate: true },
)
</script>
