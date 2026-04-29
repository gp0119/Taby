import { useDialog } from "naive-ui"
import { defineComponent, onBeforeUnmount } from "vue"
import dayjs from "dayjs"
import syncManager from "@/sync/syncManager"
import type { ConflictInfo, ConflictResolution } from "@/sync/syncManager"

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

export default defineComponent({
  name: "SyncConflictHandler",
  setup() {
    const dialog = useDialog()

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
          content: () => (
            <div class="text-sm leading-relaxed">
              <div>{`远端最近更新：${formatRemoteTime(info.remoteUpdatedAt)}`}</div>
              <div>{`本地未上传修改起始：${formatLocal(info.localDirtyAt)}`}</div>
              <div class="mt-2 opacity-70">{buildSummary(info)}</div>
              <div class="mt-2">请选择如何处理冲突：</div>
            </div>
          ),
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

    return () => null
  },
})
