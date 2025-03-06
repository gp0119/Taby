import { useI18n } from "vue-i18n"
export const useHelpi18n = () => {
  const { t } = useI18n()

  const ft = (key: string, type?: string) => {
    if (!type) return t(key)
    return t(key, { type: t(type) })
  }

  return {
    ft,
  }
}
