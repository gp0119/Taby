import { useDialog } from "naive-ui"

export function useEditDialog() {
  const dialog = useDialog()

  const open = ({
    title,
    renderContenr,
    onPositiveClick,
  }: {
    title: string
    renderContenr: () => VNode
    onPositiveClick: () => void
  }) => {
    dialog.create({
      title,
      titleClass: "[&_.n-base-icon]:hidden !text-text-primary",
      class: "bg-body-color",
      negativeText: "Cancel",
      positiveText: "Save",
      content: renderContenr,
      onPositiveClick,
    })
  }

  return {
    open,
  }
}
