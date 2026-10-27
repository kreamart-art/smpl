import { useState, useRef, useEffect } from 'react'
import { inputCls } from './ui.jsx'

// A text input with a grouped suggestion dropdown. `groups` is
// [{ label, items: [{ key, label, sub?, icon?, onPick }] }]. Keyboard:
// up/down to move, enter to pick (or submit), escape to close. Flat, bordered
// (no shadow) to match the SMPL chrome; bg/text use tokens so it adapts to the
// light theme.
export default function SuggestInput({
  value,
  onChange,
  groups = [],
  placeholder,
  type = 'text',
  onSubmit,
  className,
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const boxRef = useRef(null)
  const flat = groups.flatMap((g) => g.items)

  useEffect(() => {
    setActive(-1)
  }, [value])

  useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const pick = (item) => {
    item.onPick()
    setOpen(false)
  }

  const onKey = (e) => {
    if (!open || !flat.length) {
      if (e.key === 'Enter' && onSubmit) onSubmit()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(flat.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (active >= 0) pick(flat[active])
      else if (onSubmit) onSubmit()
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const show = open && value.trim() && flat.length > 0

  return (
    <div ref={boxRef} className={`relative ${className || ''}`}>
      <input
        type={type}
        className={inputCls}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        autoComplete="off"
      />
      {show ? (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto border border-line-bright bg-panel">
          {groups.map((g) =>
            g.items.length ? (
              <div key={g.label}>
                <div className="border-b border-line px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
                  {g.label}
                </div>
                {g.items.map((item) => {
                  const idx = flat.indexOf(item)
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => pick(item)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-[12px] transition-colors ${
                        active === idx ? 'bg-ink text-bg' : 'text-ink hover:bg-line'
                      }`}
                    >
                      {item.icon || null}
                      <span className="truncate">{item.label}</span>
                      {item.sub ? (
                        <span className={`ml-auto shrink-0 text-[10px] ${active === idx ? 'text-bg/70' : 'text-faint'}`}>
                          {item.sub}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            ) : null,
          )}
        </div>
      ) : null}
    </div>
  )
}
