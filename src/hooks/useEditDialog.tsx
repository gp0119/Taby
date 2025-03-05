import { useDialog } from "naive-ui"

export function useEditDialog() {
  const dialog = useDialog()

  const open = ({
    title,
    renderContent,
    onPositiveClick,
  }: {
    title: string
    renderContent: () => VNode
    onPositiveClick: () => void
  }) => {
    dialog.create({
      title,
      titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
      class: "bg-body-color",
      negativeText: "Cancel",
      positiveText: "Save",
      content: renderContent,
      onPositiveClick,
    })
  }

  return {
    open,
  }
}
