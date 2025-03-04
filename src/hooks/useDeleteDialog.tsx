import { useDialog } from "naive-ui"

export const useDeleteDialog = () => {
  const dialog = useDialog()
  const open = ({
    title,
    content,
    onPositiveClick,
  }: {
    title: string
    content: string
    onPositiveClick: () => void
  }) => {
    dialog.error({
      title,
      content,
      titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
      class: "bg-body-color",
      negativeText: "Cancel",
      positiveText: "Save",
      onPositiveClick,
    })
  }

  return {
    open,
  }
}
