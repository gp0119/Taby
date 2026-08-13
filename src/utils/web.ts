export const getSafeWebUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null
  } catch {
    return null
  }
}

export const openWebUrl = (value: string) => {
  const url = getSafeWebUrl(value)
  return url ? window.open(url, "_blank", "noopener,noreferrer") : null
}

export const splitHighlightedText = (text: string, query: string) => {
  const keyword = query.trim()
  if (!keyword) return [{ text, highlighted: false }]

  const matcher = new RegExp(
    keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "gi",
  )
  const parts: { text: string; highlighted: boolean }[] = []
  let cursor = 0
  for (const match of text.matchAll(matcher)) {
    const index = match.index
    if (index > cursor) {
      parts.push({ text: text.slice(cursor, index), highlighted: false })
    }
    parts.push({ text: match[0], highlighted: true })
    cursor = index + match[0].length
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), highlighted: false })
  }
  return parts.length ? parts : [{ text, highlighted: false }]
}
