<template>
  <div class="flex h-[50px] items-center justify-between overflow-hidden px-3">
    <a
      href="https://github.com/gp0119/Taby"
      target="_blank"
      class="flex flex-shrink-0 items-center justify-center text-primary"
    >
      <Logo />
    </a>
    <PopoverWrapper :message="ft('add', 'space')">
      <n-button
        quaternary
        :focusable="false"
        size="small"
        class="ml-3 w-[28px]"
        :class="[layoutStore.isLeftCollapsed ? 'animate-hide' : 'animate-show']"
        @click="onAddSpace"
      >
        <template #icon>
          <n-icon
            :component="Add"
            size="24"
            class="[&_svg]:stroke-current [&_svg]:stroke-[0.5px]"
          />
        </template>
      </n-button>
    </PopoverWrapper>
  </div>
</template>

<script setup lang="tsx">
import { useLayoutStore } from "@/store/layout"
import { Add } from "@vicons/carbon"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useEditDialog } from "@/hooks/useEditDialog.tsx"
import IconSelect from "@components/icon-select.vue"
import dataManager from "@/db"
import { useRefresh } from "@/hooks/useRresh.ts"
import PopoverWrapper from "@/components/popover-wrapper.vue"
import Logo from "@/components/logo.vue"

const layoutStore = useLayoutStore()
const { ft } = useHelpi18n()
const { open } = useEditDialog()
const { refreshSpaces } = useRefresh()

function onAddSpace() {
  const formModel = ref({ title: "", icon: "StorefrontOutline" })
  open({
    title: ft("add", "space"),
    renderContent: () => (
      <n-form model={formModel.value}>
        <n-form-item label={`${ft("title")}:`}>
          <n-input-group>
            <IconSelect v-model:value={formModel.value.icon} />
            <n-input
              v-model:value={formModel.value.title}
              placeholder={ft("placeholder", "title")}
            />
          </n-input-group>
        </n-form-item>
      </n-form>
    ),
    onPositiveClick: async () => {
      if (!formModel.value.title) return
      await dataManager.addSpace({
        title: formModel.value.title,
        icon: formModel.value.icon,
      })
      await refreshSpaces()
    },
  })
}
</script>
