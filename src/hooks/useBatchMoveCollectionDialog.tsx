import { movePosition } from "@/type"
import { ref } from "vue"
import { useHelpi18n } from "./useHelpi18n"
import { useEditDialog } from "./useEditDialog"
import SpaceSelect from "@/components/space-select.vue"
import { NForm, NFormItem, NRadioGroup, NRadioButton } from "naive-ui"

export const useBatchMoveCollectionDialog = () => {
  const { ft } = useHelpi18n()
  const { open } = useEditDialog()
  const formModel = ref<{
    spaceId: number | null
    position: movePosition
  }>({
    spaceId: null,
    position: "END",
  })

  const openDialog = (title?: string) =>
    new Promise<{
      spaceId: number | null
      position: movePosition
    }>((resolve, reject) => {
      open({
        title: title || ft("move-to"),
        renderContent: () => {
          return (
            <NForm model={formModel.value}>
              <NFormItem label={`${ft("space")}:`}>
                <SpaceSelect v-model:value={formModel.value.spaceId} />
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
          if (!formModel.value.spaceId) return
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
