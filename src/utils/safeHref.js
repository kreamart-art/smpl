// Only web and mail links become a real href; anything else (javascript:, data:)
// renders as plain text. The server filters links too, this guards old data.
export function safeHref(url) {
  const s = String(url || '').trim()
  return /^(https?:|mailto:)/i.test(s) ? s : undefined
}
