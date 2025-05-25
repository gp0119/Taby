import { useDialog, NButton } from "naive-ui"
import { VNodeChild } from "vue"
import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
export const useDeleteDialog = () => {
  const dialog = useDialog()
  const { ft } = useHelpi18n()

  const open = ({
    title,
    content,
    negativeText,
    positiveText,
    onPositiveClick,
  }: {
    title: string
    content: string | (() => VNodeChild)
    onPositiveClick: () => void
    negativeText?: string
    positiveText?: string
  }) => {
    const dialogRef = dialog.error({
      title,
      content,
      titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
      class: "bg-dialog-color",
      autoFocus: false,
      negativeText: negativeText || ft("cancel"),
      positiveText: positiveText || ft("confirm"),
      onPositiveClick,
      action: () => {
        return (
          <div class="flex items-center gap-2">
            <NButton onClick={() => dialogRef.destroy()} size="small" tertiary>
              {ft("cancel")}
            </NButton>
            <NButton
              type="primary"
              onClick={() => {
                onPositiveClick()
                dialogRef.destroy()
              }}
              size="small"
            >
              {ft("confirm")}
            </NButton>
          </div>
        )
      },
    })
  }

  return {
    open,
  }
}
