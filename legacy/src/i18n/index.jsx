import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { strings } from './strings.js'

// Tiny i18n: flat dotted keys, NL/EN, choice persisted in localStorage and
// auto-detected from the browser on first visit. t('ns.key', { n: 3 }).
const LangCtx = createContext(null)
const KEY = 'smpl_lang'

function detect() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'nl' || saved === 'en') return saved
  } catch {
    /* ignore */
  }
  try {
    if (typeof navigator !== 'undefined' && /^nl/i.test(navigator.language || '')) return 'nl'
  } catch {
    /* ignore */
  }
  return 'en'
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(detect)

  useEffect(() => {
    try {
      document.documentElement.lang = lang
    } catch {
      /* ignore */
    }
  }, [lang])

  const setLang = useCallback((l) => {
    const next = l === 'nl' ? 'nl' : 'en'
    setLangState(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const toggle = useCallback(() => setLang(lang === 'nl' ? 'en' : 'nl'), [lang, setLang])

  const t = useCallback(
    (key, vars) => {
      let s = strings[lang]?.[key] ?? strings.en?.[key] ?? key
      if (vars) for (const k in vars) s = s.split(`{${k}}`).join(String(vars[k]))
      return s
    },
    [lang],
  )

  return <LangCtx.Provider value={{ lang, setLang, toggle, t }}>{children}</LangCtx.Provider>
}

export const useI18n = () => useContext(LangCtx)
export const useT = () => useContext(LangCtx).t
