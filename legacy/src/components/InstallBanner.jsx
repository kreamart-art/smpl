import { useState } from 'react'
import { usePWA } from '../context/PWAContext.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { pushSupported, pushPermission } from '../lib/push.js'
import { IconDownload, IconShare } from './icons.jsx'

// Is a top-of-page banner (verify email / enable push) currently showing? The
// install bar yields to it so only one banner is on screen at a time.
function topBannerShowing({ currentUser, mailConfigured, pushConfigured }) {
  if (!currentUser) return false
  try {
    const verify =
      mailConfigured && !currentUser.emailVerified && sessionStorage.getItem('smpl_verify_dismissed') !== '1'
    const push =
      pushConfigured &&
      pushSupported() &&
      pushPermission() === 'default' &&
      sessionStorage.getItem('smpl_push_dismissed') !== '1'
    return !!(verify || push)
  } catch {
    return false
  }
}

function isMobileBrowser() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(max-width: 820px)')?.matches ||
    /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '')
  )
}

// Shown only on the website (not standalone): "Get the SMPL app".
export default function InstallBanner() {
  const { standalone, canInstall, promptInstall, isIOS } = usePWA()
  const { currentUser, mailConfigured, pushConfigured } = useApp()
  const t = useT()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('smpl_install_dismissed') === '1'
    } catch {
      return false
    }
  })
  const [howTo, setHowTo] = useState(false)
  const mobile = isMobileBrowser()

  // Worth showing where install is possible (native prompt) or on phones.
  if (standalone || dismissed || !(canInstall || mobile)) return null
  // Only one banner at a time: yield to a top-of-page banner if one is up.
  if (topBannerShowing({ currentUser, mailConfigured, pushConfigured })) return null

  const close = () => {
    setDismissed(true)
    try {
      localStorage.setItem('smpl_install_dismissed', '1')
    } catch {
      /* ignore */
    }
  }

  const onGet = async () => {
    if (canInstall) {
      const r = await promptInstall()
      if (r.ok) close()
    } else {
      setHowTo(true)
    }
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line-bright bg-black/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-4 py-3 sm:px-6">
          <img src="/icon-192.png" alt="" className="h-10 w-10 border border-line-bright" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="font-sans text-sm font-bold uppercase tracking-tight">{t('chrome.install.title')}</div>
            <div className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {t('chrome.install.subline')}
            </div>
          </div>
          <button
            onClick={onGet}
            className="flex h-10 shrink-0 items-center gap-2 border border-ink bg-ink px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-bg transition-colors hover:bg-bright"
          >
            <IconDownload size={15} />
            {t('chrome.install.cta')}
          </button>
          <button
            onClick={close}
            aria-label={t('chrome.install.dismiss')}
            className="flex h-10 w-9 shrink-0 items-center justify-center border border-line font-mono text-muted hover:border-line-bright hover:text-ink"
          >
            ✕
          </button>
        </div>
      </div>

      {howTo ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={() => setHowTo(false)}
        >
          <div
            className="w-full max-w-sm border border-line-bright bg-panel p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <img src="/icon-192.png" alt="" className="h-9 w-9 border border-line-bright" aria-hidden />
              <div className="font-sans text-lg font-bold uppercase tracking-tight">{t('chrome.install.howToTitle')}</div>
            </div>
            {isIOS ? (
              <ol className="mt-5 space-y-3 font-mono text-[12px] leading-relaxed text-ink-dim">
                <li className="flex items-center gap-3">
                  <IconShare size={18} className="shrink-0 text-ink" /> {t('chrome.install.iosStep1Tap')}{' '}
                  <span className="text-ink">{t('chrome.install.iosShare')}</span> {t('chrome.install.iosStep1In')}
                </li>
                <li><span className="text-ink">2 ·</span> {t('chrome.install.iosStep2')}</li>
                <li><span className="text-ink">3 ·</span> {t('chrome.install.iosStep3')}</li>
              </ol>
            ) : (
              <ol className="mt-5 space-y-3 font-mono text-[12px] leading-relaxed text-ink-dim">
                <li><span className="text-ink">1 ·</span> {t('chrome.install.androidStep1')}</li>
                <li><span className="text-ink">2 ·</span> {t('chrome.install.androidStep2')}</li>
                <li><span className="text-ink">3 ·</span> {t('chrome.install.androidStep3')}</li>
              </ol>
            )}
            <button
              onClick={() => setHowTo(false)}
              className="mt-6 h-11 w-full border border-line-bright font-mono text-[11px] uppercase tracking-[0.14em] text-ink hover:bg-ink hover:text-bg"
            >
              {t('chrome.install.gotIt')}
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
