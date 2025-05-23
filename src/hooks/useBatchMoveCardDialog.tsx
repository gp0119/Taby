import { ref } from "vue"
import { useSpacesStore } from "@/store/spaces.ts"
import { useHelpi18n } from "@/hooks/useHelpi18n"
import { movePosition } from "@/type.ts"
import { useEditDialog } from "@/hooks/useEditDialog"
import SpaceSelect from "@/components/space-select.vue"
import CollectionSelect from "@/components/collection-select.vue"
import { NForm, NFormItem, NRadioGroup, NRadioButton } from "naive-ui"

export const useBatchMoveCardDialog = () => {
  const spacesStore = useSpacesStore()
  const { ft } = useHelpi18n()
  const { open } = useEditDialog()

  const openDialog = (title?: string) =>
    new Promise<{
      spaceId: number | null
      collectionId: number | null
      position: movePosition
    }>((resolve, reject) => {
      const formModel = ref<{
        spaceId: number | null
        collectionId: number | null
        position: movePosition
      }>({
        spaceId: spacesStore.activeId,
        collectionId: null,
        position: "END",
      })
      open({
        title: title || ft("move-to"),
        renderContent: () => {
          return (
            <NForm model={formModel.value}>
              <NFormItem label={`${ft("space")}:`}>
                <SpaceSelect
                  modelValue={formModel.value.spaceId}
                  onUpdate:value={(value) => {
                    if (value !== formModel.value.spaceId) {
                      formModel.value.collectionId = null
                      formModel.value.spaceId = value as number
                    }
                  }}
                />
              </NFormItem>
              <NFormItem label={`${ft("collection")}:`}>
                <CollectionSelect
                  v-model={formModel.value.collectionId}
                  spaceId={formModel.value.spaceId!}
                />
              </NFormItem>
              <NFormItem label={`${ft("position")}:`}>
                <NRadioGroup
                  class="w-full"
                  v-model:value={formModel.value.position}
                >
                  <NRadioButton class="w-1/2 text-center" value="HEAD">
                    {ft("move-to-head")}
                  </NRadioButton>
                  <NRadioButton class="w-1/2 text-center" value="END">
                    {ft("move-to-end")}
                  </NRadioButton>
                </NRadioGroup>
              </NFormItem>
            </NForm>
          )
        },
        onPositiveClick: async () => {
          if (!formModel.value.collectionId) return
          resolve(formModel.value)
        },
        onNegativeClick: () => {
          reject()
        },
      })
    })
  return {
    openDialog,
  }
}
