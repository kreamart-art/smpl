import { useState, useCallback, useRef, useEffect } from 'react'
import { IconShare } from './icons.jsx'

// Share a battle / profile / result. Uses the native share sheet
// (navigator.share) on devices that have it — falls back to copying the link.
// The one place this lives in the SMPL chrome; styled square + mono like the rest.
export default function ShareButton({
  url,
  title = 'SMPL',
  text,
  label = 'Share',
  iconOnly = false,
  className = '',
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const flash = useCallback(() => {
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1800)
  }, [])

  const onShare = useCallback(async () => {
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
    const data = { title, text: text || title, url: shareUrl }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(data)
        return
      } catch (e) {
        if (e?.name === 'AbortError') return // user dismissed the sheet
        // otherwise fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      flash()
    } catch {
      // last-ditch: select-less prompt so the link is still grabbable
      try {
        window.prompt('Copy this link', shareUrl)
      } catch {
        /* ignore */
      }
    }
  }, [url, title, text, flash])

  if (iconOnly) {
    return (
      <button
        onClick={onShare}
        aria-label={copied ? 'Link copied' : 'Share'}
        title={copied ? 'Link copied' : 'Share'}
        className={`relative flex items-center justify-center border border-line-bright text-ink transition-colors duration-300 hover:border-ink ${className}`}
      >
        {copied ? <span className="font-mono text-[10px] uppercase tracking-[0.12em]">✓</span> : <IconShare size={18} />}
      </button>
    )
  }

  return (
    <button
      onClick={onShare}
      className={`inline-flex items-center justify-center gap-2 border border-line-bright px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors duration-300 hover:border-ink ${className}`}
    >
      <IconShare size={15} />
      {copied ? 'Link copied' : label}
    </button>
  )
}
