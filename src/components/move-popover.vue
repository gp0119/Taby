<template>
  <n-popover
    :show="show"
    :trigger="canHover ? 'hover' : 'click'"
    :placement="placement"
    :show-arrow="false"
    class="!bg-transparent !shadow-none"
    style="padding: 0"
    @update:show="onUpdateShow"
  >
    <template #trigger>
      <slot />
    </template>
    <div class="relative">
      <div
        v-if="type === 'card'"
        class="flex w-[196px] flex-col gap-y-2 rounded-lg bg-dialog-color p-2 shadow-card-shadow"
      >
        <div
          class="-mx-2 border-b border-solid border-border-color px-3 pb-2 font-bold text-text-primary"
        >
          {{ title ?? ft("move-to") }}
        </div>
        <div
          class="scrollbar-thin flex max-h-[50vh] flex-col gap-y-0.5 overflow-y-auto"
        >
          <div
            v-for="space in spaces"
            :key="space.id"
            class="flex min-h-[34px] cursor-pointer select-none items-center gap-x-2 rounded-md px-2 py-1 transition-colors duration-200 hover:bg-hover-color"
            :class="
              space.id === activeSpaceId
                ? 'bg-hover-color text-primary'
                : 'text-text-primary'
            "
            @mouseenter="canHover && (activeSpaceId = space.id)"
            @click="activeSpaceId = space.id"
          >
            <n-icon size="16" :component="getSpaceIcon(space.icon)" />
            <span class="flex-1 truncate">{{ space.title }}</span>
            <n-icon
              size="14"
              class="transition-transform duration-200"
              :class="{ 'translate-x-0.5': space.id === activeSpaceId }"
              :component="ChevronRight"
            />
          </div>
        </div>
      </div>
      <transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="-translate-x-2 opacity-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-to-class="-translate-x-2 opacity-0"
      >
        <div
          v-if="type === 'collection' || activeSpaceId !== undefined"
          class="flex w-[236px] flex-col gap-y-2 rounded-lg bg-dialog-color p-2 shadow-card-shadow"
          :class="
            type === 'card' && [
              'absolute left-full ml-2 before:absolute before:inset-y-0 before:-left-2 before:w-2',
              placement.startsWith('top') ? 'bottom-0' : 'top-0',
            ]
          "
        >
          <div
            v-if="type === 'collection'"
            class="-mx-2 border-b border-solid border-border-color px-3 pb-2 font-bold text-text-primary"
          >
            {{ title ?? ft("move-to") }}
          </div>
          <div
            :key="activeSpaceId"
            class="scrollbar-thin flex max-h-[50vh] animate-show flex-col gap-y-0.5 overflow-y-auto"
          >
            <div
              v-for="target in targets"
              :key="target.id"
              class="group/move flex min-h-[34px] select-none items-center rounded-md border border-transparent px-2 py-1 text-text-primary transition-colors duration-200 hover:border-primary hover:bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]"
            >
              <div
                class="flex max-w-0 items-center gap-x-0.5 overflow-hidden opacity-0 transition-all duration-200 group-hover/move:mr-1.5 group-hover/move:max-w-[60px] group-hover/move:opacity-100"
                :class="{ 'mr-1.5 !max-w-[60px] !opacity-100': !canHover }"
              >
                <PopoverWrapper
                  v-for="action in POSITION_ACTIONS"
                  :key="action.position"
                  :message="ft(action.label)"
                  placement="top"
                >
                  <n-button
                    quaternary
                    circle
                    size="tiny"
                    type="primary"
                    :focusable="false"
                    class="group-hover/move:animate-scale-in"
                    @click="onSelect(target.id, action.position)"
                  >
                    <template #icon>
                      <n-icon
                        :component="action.icon"
                        class="[&_svg]:stroke-current [&_svg]:stroke-[1.5px]"
                      />
                    </template>
                  </n-button>
                </PopoverWrapper>
              </div>
              <n-icon
                v-if="type === 'collection'"
                size="16"
                class="mr-1.5"
                :component="getSpaceIcon(target.icon)"
              />
              <span class="flex-1 truncate">{{ target.title }}</span>
            </div>
            <n-empty
              v-if="!targets.length"
              size="small"
              :description="
                ft(type === 'collection' ? 'no-other-spaces' : 'no-collections')
              "
              class="py-3 [&_.n-empty\_\_description]:whitespace-nowrap [&_.n-empty\_\_description]:!text-xs"
            />
          </div>
          <div
            class="-mx-2 border-t border-solid border-border-color px-2 pt-2"
          >
            <n-input
              v-if="isCreating"
              v-model:value="newTitle"
              autofocus
              :placeholder="ft('create', createType)"
              @keyup.enter="onCreate"
              @blur="isCreating = false"
            />
            <div
              v-else
              class="flex min-h-[34px] cursor-pointer select-none items-center gap-x-1.5 rounded-md px-2 text-text-secondary transition-colors duration-200 hover:bg-hover-color hover:text-primary"
              @click="isCreating = true"
            >
              <n-icon size="16" :component="Add" />
              <span class="truncate">{{ ft("create", createType) }}</span>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </n-popover>
</template>

<script setup lang="ts">
import type { PopoverPlacement } from "naive-ui"
import { Add, ChevronRight, UpToTop, DownToBottom } from "@vicons/carbon"
import dataManager from "@/db"
import type { SpaceWithCollections, movePosition } from "@/type"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useCanHover } from "@/hooks/useCanHover"
import { useSpacesStore } from "@/store/spaces"
import { useRefresh } from "@/hooks/useRresh"
import { ICON_LIST } from "@/utils/constants"
import PopoverWrapper from "@/components/popover-wrapper.vue"

const props = withDefaults(
  defineProps<{
    type: "card" | "collection"
    title?: string
    placement?: PopoverPlacement
  }>(),
  {
    title: undefined,
    placement: "bottom",
  },
)

const emit = defineEmits<{
  (e: "select", id: number, position: movePosition): void
}>()

const show = defineModel<boolean>("show", { default: false })

const POSITION_ACTIONS = [
  { position: "HEAD", label: "move-to-head", icon: UpToTop },
  { position: "END", label: "move-to-end", icon: DownToBottom },
] as const

const { ft } = useHelpi18n()
const canHover = useCanHover()
const spacesStore = useSpacesStore()
const { updateContextMenus } = useRefresh()
const spaces = ref<SpaceWithCollections[]>([])
const activeSpaceId = ref<number>()
const isCreating = ref(false)
const newTitle = ref("")

const createType = computed(() =>
  props.type === "collection" ? "space" : "collection",
)

const getSpaceIcon = (icon?: string) => ICON_LIST[icon ?? "StorefrontOutline"]

const targets = computed(() => {
  if (props.type === "collection") {
    return spaces.value
      .filter((space) => space.id !== spacesStore.activeId)
      .map(({ id, title, icon }) => ({ id, title, icon }))
  }
  const activeSpace = spaces.value.find(
    (space) => space.id === activeSpaceId.value,
  )
  return (activeSpace?.collections ?? []).map(({ id, title }) => ({
    id,
    title,
    icon: undefined,
  }))
})

const onUpdateShow = async (value: boolean) => {
  show.value = value
  if (!value) return
  activeSpaceId.value = undefined
  isCreating.value = false
  spaces.value = await dataManager.getAllSpaceWithCollections()
}

const onCreate = async () => {
  const title = newTitle.value.trim()
  if (!title) return
  if (props.type === "collection") {
    await dataManager.addSpace({ title })
  } else {
    await dataManager.addCollection({
      title,
      spaceId: activeSpaceId.value!,
      labelIds: [],
    })
  }
  newTitle.value = ""
  isCreating.value = false
  spaces.value = await dataManager.getAllSpaceWithCollections()
  await updateContextMenus()
}

const onSelect = (id: number, position: movePosition) => {
  show.value = false
  emit("select", id, position)
}
</script>
