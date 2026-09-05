import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import { useDialog, useMessage } from "naive-ui"

export function useEditDialog() {
  const dialog = useDialog()
  const message = useMessage()
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
    onPositiveClick?: () => void | boolean | Promise<void | boolean>
    onNegativeClick?: () => void
    icon?: () => VNode
    positiveText?: string
    negativeText?: string
  }) => {
    let confirmed = false
    const dialogRef = dialog.create({
      title,
      titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
      class: `bg-dialog-color ${className}`,
      autoFocus: false,
      closeFocusable: false,
      negativeText: negativeText || ft("cancel"),
      positiveText: positiveText || ft("confirm"),
      content: renderContent,
      ...(icon ? { icon } : {}),
      positiveButtonProps: { size: "small" },
      negativeButtonProps: { size: "small" },
      onAfterLeave: () => {
        if (!confirmed) onNegativeClick?.()
      },
      onPositiveClick: async () => {
        if (dialogRef.loading) return false
        dialogRef.loading = true
        dialogRef.closable = false
        dialogRef.maskClosable = false
        dialogRef.closeOnEsc = false
        dialogRef.negativeButtonProps = { size: "small", disabled: true }
        try {
          const result = await onPositiveClick?.()
          confirmed = result !== false
          return result
        } catch (error) {
          message.error(error instanceof Error ? error.message : ft("fail"))
          return false
        } finally {
          dialogRef.loading = false
          dialogRef.closable = true
          dialogRef.maskClosable = true
          dialogRef.closeOnEsc = true
          dialogRef.negativeButtonProps = { size: "small" }
        }
      },
      ...(renderAction
        ? { action: () => renderAction({ close: () => dialogRef.destroy() }) }
        : {}),
    })
  }

  return { open }
}
