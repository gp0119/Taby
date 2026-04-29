<template>
  <!-- 仅用于在 dialog provider 内部注册冲突弹窗回调，无可见 UI -->
</template>

<script setup lang="ts">
import { useDialog } from "naive-ui"
import { onBeforeUnmount, h } from "vue"
import syncManager, {
  ConflictInfo,
  ConflictResolution,
} from "@/sync/syncManager"
import dayjs from "dayjs"

const dialog = useDialog()

const formatRemoteTime = (iso: string) => {
  if (!iso) return ""
  const t = dayjs(iso)
  return t.isValid() ? t.format("YYYY-MM-DD HH:mm:ss") : iso
}

const formatLocal = (ts: number | null) => {
  if (!ts) return "-"
  return dayjs(ts).format("YYYY-MM-DD HH:mm:ss")
}

const buildSummary = (info: ConflictInfo) => {
  const r = info.remoteData
  return [
    `远端 Spaces: ${r.spaces?.length ?? 0}`,
    `远端 Collections: ${r.collections?.length ?? 0}`,
    `远端 Cards: ${r.cards?.length ?? 0}`,
  ].join(" · ")
}

syncManager.setConflictHandler((info: ConflictInfo) => {
  return new Promise<ConflictResolution>((resolve) => {
    let resolved = false
    const decide = (r: ConflictResolution) => {
      if (resolved) return
      resolved = true
      resolve(r)
    }
    dialog.warning({
      title: "云端数据已被其它设备修改",
      maskClosable: false,
      closeOnEsc: false,
      closable: true,
      onClose: () => decide("cancel"),
      content: () =>
        h("div", { class: "text-sm leading-relaxed" }, [
          h("div", null, `远端最近更新：${formatRemoteTime(info.remoteUpdatedAt)}`),
          h("div", null, `本地未上传修改起始：${formatLocal(info.localDirtyAt)}`),
          h("div", { class: "mt-2 opacity-70" }, buildSummary(info)),
          h("div", { class: "mt-2" }, "请选择如何处理冲突："),
        ]),
      positiveText: "用本地覆盖云端",
      negativeText: "放弃本地，使用云端",
      onPositiveClick: () => {
        decide("local")
      },
      onNegativeClick: () => {
        decide("remote")
      },
    })
  })
})

onBeforeUnmount(() => {
  syncManager.setConflictHandler(undefined)
})
</script>
