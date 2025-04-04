import { useHelpi18n } from "@/hooks/useHelpi18n.ts"
import { useDialog } from "naive-ui"

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
  }: {
    title: string | (() => VNode)
    renderContent: () => VNode
    renderAction?: () => VNode
    onPositiveClick?: () => void
    onNegativeClick?: () => void
    icon?: () => VNode
    positiveText?: string
    negativeText?: string
  }) => {
    dialog.create({
      title,
      titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
      class: "bg-body-color",
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
      ...(renderAction ? { action: renderAction } : {}),
    })
  }

  return {
    open,
  }
}
