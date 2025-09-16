<template>
  <PopoverWrapper :message="ft('placeholder-search')" placement="bottom-end">
    <n-button
      tertiary
      :focusable="false"
      size="small"
      class="w-[28px] !shadow-btn-shadow"
      @click="openModal"
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

const { ft } = useHelpi18n()

const { openModal } = useSearchModal()

const shortcuts = computed(() => {
  const sc = useSettingStore().getSetting("shortcutSettings")
  return [
    {
      shortcut: sc.globalSearch,
      handler: () => openModal(),
    },
  ]
})
useShortcutHotkeys(shortcuts)
</script>
