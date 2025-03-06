import { useDialog } from "naive-ui"
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
    dialog.error({
      title,
      content,
      titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
      class: "bg-body-color",
      negativeText: negativeText || ft("cancel"),
      positiveText: positiveText || ft("confirm"),
      onPositiveClick,
    })
  }

  return {
    open,
  }
}
