<template>
  <div
    class="group/item flex h-full w-full flex-col rounded-xl border-2 border-transparent bg-card-color"
    :class="{
      '!border-primary': batchCollectionStore.selectedCollectionIds.includes(
        collection.id,
      ),
    }"
  >
    <div
      class="group/collection-title flex w-full items-center justify-between px-6 py-3"
    >
      <div class="flex-center select-none">
        <div class="flex-center relative">
          <n-checkbox
            class="absolute -left-5 mr-2 hidden w-[20px] group-hover/collection-title:block"
            :class="{
              '!block': batchCollectionStore.selectedCollectionIds.includes(
                collection.id,
              ),
              '!hidden':
                batchCardStore.selectedCardIds.length > 0 ||
                batchTabsStore.selectedTabIds.length > 0 ||
                duplicateCardStore.isFindDuplicate,
            }"
            size="large"
            :checked="
              batchCollectionStore.selectedCollectionIds.includes(collection.id)
            "
            @update:checked="onHandleCheckbox($event, collection.id)"
          />
          <div
            class="flex-center cursor-pointer text-text-primary"
            :class="{
              '!text-primary':
                batchCollectionStore.selectedCollectionIds.includes(
                  collection.id,
                ),
            }"
            @click="isOpen = !isOpen"
          >
            <n-icon
              size="20"
              class="w-[20px] transition-transform duration-300"
              :class="{ 'rotate-90': isOpen }"
            >
              <ChevronForward />
            </n-icon>
            <span class="ml-2 text-lg font-medium">
              {{ collection.title }}
            </span>
          </div>
          <span class="mx-4 h-[16px] w-[0.5px] bg-text-secondary" />
          <PopoverWrapper :message="ft('open-all-tabs')" placement="top-start">
            <div
              class="flex cursor-pointer items-center rounded bg-hover-color py-0.5 pl-1.5 pr-0.5 text-xs text-text-secondary"
              @click="onOpenCollection(collection)"
            >
              {{ collection.cards.length }} cards
              <n-icon size="12" :component="ArrowUpRight" />
            </div>
          </PopoverWrapper>
        </div>
        <span
          v-if="collection.labels.length > 0"
          class="mx-4 h-[16px] w-[0.5px] bg-text-secondary"
        />
        <Tags :labels="collection.labels" :collection-id="collection.id" />
      </div>
      <CollectionAction :item="collection" />
    </div>

    <div
      class="grid flex-1 transition-[grid-template-rows] duration-300 ease-in-out"
      :class="isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    >
      <div class="overflow-hidden">
        <slot name="cards" :collection="collection" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronForward } from "@vicons/ionicons5"
import { ArrowUpRight } from "@vicons/carbon"
import { CollectionWithCards } from "@/type"
import CollectionAction from "./collection-action.vue"
import Tags from "./tags.vue"
import { useExpandStore } from "@/store/expand"
import { useBatchCollectionStore } from "@/store/batch-collection"
import { useBatchCardStore } from "@/store/batch-card"
import { useBatchTabsStore } from "@/store/batch-tabs"
import { useDuplicateCardStore } from "@/store/duplicate-card"
import PopoverWrapper from "@/components/popover-wrapper.vue"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { useChromeTabs } from "@/hooks/useChromeTabs"
import { useSettingStore } from "@/store/setting"

const { ft } = useHelpi18n()
const settingStore = useSettingStore()
const duplicateCardStore = useDuplicateCardStore()
const { openTabs, groupTabs } = useChromeTabs()
const props = defineProps<{
  collection: CollectionWithCards
}>()

const expandStore = useExpandStore()
const batchCollectionStore = useBatchCollectionStore()
const batchCardStore = useBatchCardStore()
const batchTabsStore = useBatchTabsStore()
const isOpen = computed({
  get: () => expandStore.isCollectionExpanded(props.collection.id),
  set: (value) => {
    if (value) {
      expandStore.toggleCollection(props.collection.id)
    } else {
      expandStore.toggleCollection(props.collection.id)
    }
  },
})

const onHandleCheckbox = (checked: boolean, collectionId: number) => {
  if (checked) {
    batchCollectionStore.addSelectedCollectionId(collectionId)
  } else {
    batchCollectionStore.removeSelectedCollectionId(collectionId)
  }
}

async function onOpenCollection(collection: CollectionWithCards) {
  console.log("collection: ", collection)
  if (collection.cards.length === 0) return
  const tabs = await openTabs(collection.cards.map((card) => card.url))
  if (settingStore.getSetting("openCardsInGroup") && tabs.length > 0) {
    const tabsIds = tabs.map((tab) => tab.id!)
    await groupTabs(tabsIds, collection.title)
  }
}
</script>
