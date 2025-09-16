<template>
  <PopoverWrapper :message="searchTooltip" placement="bottom-end">
    <n-button
      tertiary
      :focusable="false"
      size="small"
      class="w-[28px] !shadow-btn-shadow"
      @click="toggleModal"
    >
      <template #icon>
        <n-icon size="18" :component="Search" />
      </template>
    </n-button>
  </PopoverWrapper>
</template>

<script setup lang="tsx">
import { Search } from "@vicons/ionicons5"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import PopoverWrapper from "@/components/popover-wrapper.vue"
import { useSearchModal } from "@/hooks/useSearchModal"
import { useShortcutHotkeys } from "@/hooks/useShortcutHotkeys"
import { useSettingStore } from "@/store/setting"

const { ft, ft2 } = useHelpi18n()

const { toggleModal } = useSearchModal()

const settingStore = useSettingStore()
const shortcutsSetting = computed(() =>
  settingStore.getSetting("shortcutSettings"),
)

const searchTooltip = computed(() => {
  const combo = shortcutsSetting.value?.globalSearch
  return combo ? ft2("search-hint", { combo }) : ft("search-hint-no-shortcut")
})

const shortcuts = computed(() => [
  {
    shortcut: shortcutsSetting.value?.globalSearch,
    handler: () => toggleModal(),
  },
])
useShortcutHotkeys(shortcuts)
</script>
