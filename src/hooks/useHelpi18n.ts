import { useI18n } from "vue-i18n"
export const useHelpi18n = () => {
  const { t } = useI18n()

  const ft = (key: string, type?: string) => {
    if (!type) return t(key)
    return t(key, { type: t(type) })
  }

  const gt = (key: string, value: string | number) => {
    return t(key, { type: value })
  }

  const ft2 = (key: string, obj: Record<string, string>) => {
    return t(key, obj)
  }

  return {
    ft,
    gt,
    ft2,
  }
}
