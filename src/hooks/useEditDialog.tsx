import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import { useDialog, NButton } from "naive-ui"

export function useEditDialog() {
  const dialog = useDialog()
  const { ft } = useHelpi18n()

  const open = ({
    title,
    renderContent,
    renderAction,
    icon,
    onPositiveClick,
    onNegativeClick,
    positiveText,
    negativeText,
    className,
  }: {
    title: string | (() => VNode)
    className?: string
    renderContent: () => VNode
    renderAction?: (props: { close: () => void }) => VNode
    onPositiveClick?: () => void
    onNegativeClick?: () => void
    icon?: () => VNode
    positiveText?: string
    negativeText?: string
  }) => {
    const dialogRef = dialog.create({
      title,
      titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
      class: `bg-dialog-color ${className}`,
      autoFocus: true,
      closeFocusable: false,
      negativeText: negativeText || ft("cancel"),
      positiveText: positiveText || ft("confirm"),
      content: renderContent,
      ...(icon ? { icon } : {}),
      ...(onPositiveClick ? { onPositiveClick } : {}),
      ...(onNegativeClick
        ? {
            onNegativeClick,
            onClose: onNegativeClick,
            onMaskClick: onNegativeClick,
          }
        : {}),
      ...(renderAction
        ? {
            action: () =>
              renderAction({
                close: () => dialogRef.destroy(),
              }),
          }
        : {
            action: () => {
              return (
                <div class="flex items-center gap-2">
                  <NButton
                    onClick={() => dialogRef.destroy()}
                    size="small"
                    tertiary
                  >
                    {ft("cancel")}
                  </NButton>
                  <NButton
                    type="primary"
                    onClick={() => {
                      onPositiveClick?.()
                      dialogRef.destroy()
                    }}
                    size="small"
                  >
                    {ft("confirm")}
                  </NButton>
                </div>
              )
            },
          }),
    })
  }

  return {
    open,
  }
}
