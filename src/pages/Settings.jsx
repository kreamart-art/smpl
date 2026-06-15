import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { usePWA } from '../context/PWAContext.jsx'
import Avatar from '../components/Avatar.jsx'
import VerifiedBadge from '../components/VerifiedBadge.jsx'
import { TwoFactorPanel, DeleteAccountPanel } from '../components/SecurityPanels.jsx'
import LangToggle from '../components/LangToggle.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { IconSettings, IconLogout, IconShield, IconTrash, IconGlobe, IconBell, IconUser } from '../components/icons.jsx'
import { pushSupported, pushPermission, isPushSubscribed, enablePush, disablePush } from '../lib/push.js'
import { Field, inputCls } from '../components/ui.jsx'
import { ageFrom } from '../utils/wave.js'
import { useT } from '../i18n/index.jsx'

function PrivateCell({ label, value }) {
  return (
    <div className="bg-bg px-5 py-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">{label}</div>
      <div className="mt-1.5 font-mono text-sm text-ink">{value || '—'}</div>
    </div>
  )
}

function NotificationsRow() {
  const { pushConfigured } = useApp()
  const t = useT()
  const [on, setOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [perm, setPerm] = useState('default')

  useEffect(() => {
    setPerm(pushPermission())
    isPushSubscribed().then(setOn)
  }, [])

  if (!pushConfigured || !pushSupported()) return null

  const toggle = async () => {
    setBusy(true)
    if (on) {
      await disablePush()
      setOn(false)
    } else {
      const r = await enablePush()
      setOn(!!r.ok)
    }
    setPerm(pushPermission())
    setBusy(false)
  }

  return (
    <div className="flex w-full items-center gap-3 px-5 py-4 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-dim">
      <IconBell size={18} />
      <span>{t('push.settings')}</span>
      <span className="ml-auto">
        {perm === 'denied' ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">{t('push.blockedShort')}</span>
        ) : (
          <button
            onClick={toggle}
            disabled={busy}
            className={`border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors disabled:opacity-50 ${
              on ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:border-ink'
            }`}
          >
            {on ? t('push.on') : t('push.off')}
          </button>
        )}
      </span>
    </div>
  )
}

function PersonalDataPanel({ user, onBack }) {
  const t = useT()
  const { updateProfile, exportData } = useApp()
  const downloadData = async () => {
    const r = await exportData()
    if (!r.ok || !r.data) return
    const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'smpl-my-data.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
  const age = ageFrom(user.dob, Date.now())
  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    country: user.country || '',
    city: user.city || '',
  })
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const upd = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setSaved(false)
  }
  const save = async () => {
    setBusy(true)
    const r = await updateProfile(form)
    setBusy(false)
    if (r.ok) setSaved(true)
  }

  return (
    <div className="border border-line-bright bg-panel">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink">
          <span>⌧</span> {t('settings.personalData')}
        </span>
        <button onClick={onBack} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
          ◂ {t('common.back')}
        </button>
      </div>
      <div className="space-y-4 p-5">
        <Field label={t('profile.legalName')}>
          <input className={inputCls} value={form.name} onChange={upd('name')} placeholder={t('profile.legalNamePh')} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('profile.phone')}>
            <input className={inputCls} type="tel" value={form.phone} onChange={upd('phone')} placeholder="+31 6 …" />
          </Field>
          <Field label={t('profile.country')}>
            <input className={inputCls} value={form.country} onChange={upd('country')} placeholder="Nederland" />
          </Field>
        </div>
        <Field label={t('profile.city')}>
          <input className={inputCls} value={form.city} onChange={upd('city')} placeholder="Amsterdam" />
        </Field>

        {/* fixed identity — not editable here */}
        <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2">
          <PrivateCell
            label={t('profile.dob')}
            value={user.dob ? (age != null ? t('profile.dobYears', { dob: user.dob, age }) : user.dob) : '—'}
          />
          <PrivateCell label={t('profile.email')} value={user.email} />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={busy}
            className="border border-line-bright px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg disabled:opacity-40"
          >
            {busy ? t('profile.saving') : t('common.save')}
          </button>
          {saved ? <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">✓ {t('profile.saved')}</span> : null}
        </div>
        <div className="border-t border-line pt-4">
          <button
            onClick={downloadData}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
          >
            ↓ {t('settings.downloadData')}
          </button>
        </div>
        <p className="font-mono text-[10px] leading-relaxed text-muted">
          {t('profile.privateFootnote')} {t('settings.dataLockedHint')}
        </p>
      </div>
    </div>
  )
}

// Listener → producer/artist (and back). Staff tiers can't change here.
function AccountTypePanel({ user, onBack }) {
  const t = useT()
  const { updateRole } = useApp()
  const [busy, setBusy] = useState(null)
  const pick = async (role) => {
    if (role === user.role) return
    setBusy(role)
    // keep "does both" when switching between producer/artist; drop it for listener
    await updateRole(role, role !== 'listener' && user.dualRole)
    setBusy(null)
  }
  const toggleDual = async () => {
    setBusy('dual')
    await updateRole(user.role, !user.dualRole)
    setBusy(null)
  }
  return (
    <div className="border border-line-bright bg-panel">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink">
          <span>⇄</span> {t('settings.accountType')}
        </span>
        <button onClick={onBack} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
          ◂ {t('common.back')}
        </button>
      </div>
      <p className="px-5 py-3 font-mono text-[10px] leading-relaxed text-muted">{t('settings.accountTypeHint')}</p>
      <div className="divide-y divide-line">
        {['listener', 'producer', 'artist'].map((role) => {
          const active = role === user.role
          return (
            <button
              key={role}
              onClick={() => pick(role)}
              disabled={!!busy}
              className={`flex w-full items-center justify-between px-5 py-4 text-left font-mono text-[12px] uppercase tracking-[0.12em] transition-colors hover:bg-bg ${
                active ? 'text-ink' : 'text-ink-dim'
              }`}
            >
              <span>{t(`role.${role}`)}</span>
              {active ? (
                <span className="font-mono text-[10px] text-ink">● {t('settings.currentAccount')}</span>
              ) : busy === role ? (
                <span className="text-muted">…</span>
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{t('settings.switchTo')}</span>
              )}
            </button>
          )
        })}
      </div>
      {user.role === 'producer' || user.role === 'artist' ? (
        <div className="border-t border-line px-5 py-4">
          <button
            onClick={toggleDual}
            disabled={!!busy}
            className="flex w-full items-center justify-between text-left font-mono text-[12px] uppercase tracking-[0.12em] text-ink-dim transition-colors hover:text-ink"
          >
            <span>{t('settings.dualRole')}</span>
            <span className={`font-mono text-[10px] ${user.dualRole ? 'text-ink' : 'text-faint'}`}>
              {busy === 'dual' ? '…' : user.dualRole ? t('profile.on') : t('profile.off')}
            </span>
          </button>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-faint">{t('settings.dualRoleHint')}</p>
        </div>
      ) : null}
    </div>
  )
}

// Hop between the founder's house accounts (admin + the official @SMPL) without
// a re-login. Stored sessions switch instantly; house accounts not yet added
// are minted via the admin-only endpoint (so only the admin can add one).
function AccountSwitcher({ onBack }) {
  const t = useT()
  const { currentUser, isAdmin, accountSessions, fetchHouseAccounts, switchAccount } = useApp()
  const [house, setHouse] = useState([])
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    if (!isAdmin) return
    let alive = true
    fetchHouseAccounts().then((r) => {
      if (alive && r.ok) setHouse(r.accounts || [])
    })
    return () => {
      alive = false
    }
  }, [isAdmin, fetchHouseAccounts])

  // Merge stored sessions (switch client-side) with mintable house accounts.
  const byId = new Map()
  for (const s of accountSessions) {
    byId.set(s.id, { id: s.id, alias: s.alias, avatar: s.avatar, role: s.role, stored: true })
  }
  for (const h of house) {
    const ex = byId.get(h.id)
    if (ex) ex.verified = h.verified
    else byId.set(h.id, { id: h.id, alias: h.alias, avatar: h.avatar, verified: h.verified })
  }
  const list = [...byId.values()]

  const go = async (id) => {
    if (id === currentUser?.id) return
    setBusy(id)
    await switchAccount(id)
    setBusy(null)
  }

  return (
    <div className="border border-line-bright bg-panel">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink">
          <span>⇄</span> {t('settings.switchAccount')}
        </span>
        <button onClick={onBack} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
          ◂ {t('common.back')}
        </button>
      </div>
      <p className="px-5 py-3 font-mono text-[10px] leading-relaxed text-muted">{t('settings.switchAccountHint')}</p>
      <div className="divide-y divide-line">
        {list.map((a) => {
          const current = a.id === currentUser?.id
          return (
            <div key={a.id} className="flex items-center gap-3 px-5 py-3.5">
              <Avatar alias={a.alias} src={a.avatar} size={36} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-mono text-[12px] text-ink">@{a.alias}</span>
                  {a.verified ? <VerifiedBadge size={12} /> : null}
                </div>
                {current ? (
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                    {t('settings.currentAccount')}
                  </span>
                ) : null}
              </div>
              <div className="ml-auto">
                {current ? (
                  <span className="font-mono text-[11px] text-ink">●</span>
                ) : (
                  <button
                    onClick={() => go(a.id)}
                    disabled={busy === a.id}
                    className="border border-line-bright px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg disabled:opacity-40"
                  >
                    {busy === a.id ? '…' : t('settings.switchTo')}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Change your @handle and login email. A new email must be re-verified; the
// admin-granted badge is unaffected.
function IdentityPanel({ user, onBack }) {
  const t = useT()
  const { updateProfile } = useApp()
  const [alias, setAlias] = useState(user.alias || '')
  const [email, setEmail] = useState(user.email || '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const aliasChanged = alias.trim() !== user.alias
  const emailChanged = email.trim().toLowerCase() !== String(user.email || '').toLowerCase()
  const clear = () => {
    setMsg('')
    setErr('')
  }
  const save = async () => {
    clear()
    setBusy(true)
    const payload = {}
    if (aliasChanged) payload.alias = alias.trim()
    if (emailChanged) payload.email = email.trim()
    const r = await updateProfile(payload)
    setBusy(false)
    if (r.ok) setMsg(emailChanged ? t('settings.identityEmailSent') : t('settings.identitySaved'))
    else setErr(r.error || t('settings.saveFailed'))
  }

  return (
    <div className="border border-line-bright bg-panel">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink">
          <span>@</span> {t('settings.identity')}
        </span>
        <button onClick={onBack} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
          ◂ {t('common.back')}
        </button>
      </div>
      <div className="space-y-4 p-5">
        <Field label={t('settings.handle')} hint={t('settings.handleHint')}>
          <input
            className={inputCls}
            value={alias}
            onChange={(e) => {
              setAlias(e.target.value)
              clear()
            }}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="jouwnaam"
          />
        </Field>
        <Field label={t('profile.email')} hint={t('settings.emailHint')}>
          <input
            className={inputCls}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clear()
            }}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="jij@voorbeeld.nl"
          />
        </Field>
        {err ? <p className="font-mono text-[11px] text-ink">{err}</p> : null}
        {msg ? <p className="font-mono text-[11px] text-muted">✓ {msg}</p> : null}
        <button
          onClick={save}
          disabled={busy || !(aliasChanged || emailChanged)}
          className="border border-line-bright px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg disabled:opacity-40"
        >
          {busy ? t('profile.saving') : t('common.save')}
        </button>
        <p className="font-mono text-[10px] leading-relaxed text-faint">{t('settings.identityNote')}</p>
      </div>
    </div>
  )
}

// "Install SMPL" — one-tap on Chrome/Android, step-by-step on iOS Safari.
function InstallPanel({ onBack }) {
  const t = useT()
  const { canInstall, promptInstall, isIOS } = usePWA()
  const [done, setDone] = useState(false)
  const go = async () => {
    const r = await promptInstall()
    if (r.ok) setDone(true)
  }
  const Step = ({ n, children }) => (
    <li className="flex gap-2">
      <span className="text-ink">{n} ·</span>
      <span>{children}</span>
    </li>
  )
  return (
    <div className="border border-line-bright bg-panel">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink">
          <span>⤓</span> {t('settings.install')}
        </span>
        <button onClick={onBack} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
          ◂ {t('common.back')}
        </button>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <img src="/icon-192.png" alt="" className="h-12 w-12 border border-line-bright" />
          <div className="min-w-0">
            <div className="font-sans text-base font-bold uppercase tracking-tight">{t('chrome.install.title')}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{t('chrome.install.subline')}</div>
          </div>
        </div>
        {canInstall ? (
          <button
            onClick={go}
            className="h-11 w-full border border-ink bg-ink font-mono text-[11px] uppercase tracking-[0.14em] text-bg transition-colors hover:bg-bright"
          >
            {done ? t('chrome.install.gotIt') : t('chrome.install.cta')}
          </button>
        ) : (
          <ol className="space-y-3 font-mono text-[12px] leading-relaxed text-ink-dim">
            {isIOS ? (
              <>
                <Step n="1">
                  {t('chrome.install.iosStep1Tap')} <span className="text-ink">{t('chrome.install.iosShare')}</span>{' '}
                  {t('chrome.install.iosStep1In')}
                </Step>
                <Step n="2">{t('chrome.install.iosStep2')}</Step>
                <Step n="3">{t('chrome.install.iosStep3')}</Step>
              </>
            ) : (
              <>
                <Step n="1">{t('chrome.install.androidStep1')}</Step>
                <Step n="2">{t('chrome.install.androidStep2')}</Step>
                <Step n="3">{t('chrome.install.androidStep3')}</Step>
              </>
            )}
          </ol>
        )}
      </div>
    </div>
  )
}

// A curator/admin can opt to ALSO compete in battles. Enabling it requires
// accepting the extra terms (above all: never compete in a battle you curate).
function CuratorCompetePanel({ user, onBack }) {
  const t = useT()
  const { setCuratorCompetes } = useApp()
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const on = !!user.curatorCompetes

  const enable = async () => {
    setBusy(true)
    await setCuratorCompetes(true, true)
    setBusy(false)
    setConfirm(false)
  }
  const disable = async () => {
    setBusy(true)
    await setCuratorCompetes(false)
    setBusy(false)
  }

  return (
    <div className="border border-line-bright bg-panel">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink">
          <span>⚔</span> {t('settings.compete')}
        </span>
        <button onClick={onBack} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
          ◂ {t('common.back')}
        </button>
      </div>
      <div className="space-y-4 p-5">
        <p className="font-mono text-[11px] leading-relaxed text-muted">{t('settings.competeHint')}</p>
        <div className="flex items-center justify-between border border-line px-4 py-3.5">
          <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-ink">{t('settings.competeToggle')}</span>
          <button
            onClick={() => (on ? disable() : setConfirm(true))}
            disabled={busy}
            className={`border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors disabled:opacity-50 ${
              on ? 'border-ink bg-ink text-bg' : 'border-line-bright text-ink hover:border-ink'
            }`}
          >
            {busy ? '…' : on ? t('profile.on') : t('profile.off')}
          </button>
        </div>
        <p className="font-mono text-[10px] leading-relaxed text-faint">
          {on ? t('settings.competeOnNote') : t('settings.competeOffNote')}
        </p>
      </div>

      {confirm ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setConfirm(false)}
        >
          <div
            className="w-full max-w-[460px] border border-line-bright bg-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="border-b border-line px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink">
              {t('settings.competeTermsTitle')}
            </div>
            <ul className="space-y-3 p-5 font-mono text-[12px] leading-relaxed text-ink-dim">
              <li className="flex gap-2">
                <span className="text-ink">›</span> {t('settings.competeTerm1')}
              </li>
              <li className="flex gap-2">
                <span className="text-ink">›</span>
                <span className="text-ink">{t('settings.competeTerm2')}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-ink">›</span> {t('settings.competeTerm3')}
              </li>
            </ul>
            <div className="flex gap-3 px-5 pb-5">
              <button
                onClick={enable}
                disabled={busy}
                className="flex-1 border border-ink bg-ink px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-bg transition-colors hover:bg-bright disabled:opacity-50"
              >
                {busy ? '…' : t('settings.competeAccept')}
              </button>
              <button
                onClick={() => setConfirm(false)}
                className="border border-line-bright px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-bg"
              >
                {t('safety.cancel')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function Settings() {
  const { currentUser, logout, isHouse, isCurator } = useApp()
  const { standalone } = usePWA()
  const navigate = useNavigate()
  const t = useT()
  const [view, setView] = useState('menu')

  if (!currentUser) return <Navigate to="/login" replace />
  const user = currentUser

  const out = async () => {
    await logout()
    navigate(standalone ? '/login' : '/')
  }

  const Shell = ({ children }) => (
    <div className="mx-auto max-w-[640px] px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => (view === 'menu' ? navigate(`/profile/${encodeURIComponent(user.alias)}`) : setView('menu'))}
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink"
        >
          ◂ {view === 'menu' ? t('common.profile') : t('common.settings')}
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-faint">{t('common.settings')}</span>
      </div>
      {children}
    </div>
  )

  if (view === '2fa') return <Shell><TwoFactorPanel onBack={() => setView('menu')} /></Shell>
  if (view === 'delete') return <Shell><DeleteAccountPanel onBack={() => setView('menu')} /></Shell>
  if (view === 'private') return <Shell><PersonalDataPanel user={user} onBack={() => setView('menu')} /></Shell>
  if (view === 'role') return <Shell><AccountTypePanel user={user} onBack={() => setView('menu')} /></Shell>
  if (view === 'switch') return <Shell><AccountSwitcher onBack={() => setView('menu')} /></Shell>
  if (view === 'identity') return <Shell><IdentityPanel user={user} onBack={() => setView('menu')} /></Shell>
  if (view === 'install') return <Shell><InstallPanel onBack={() => setView('menu')} /></Shell>
  if (view === 'compete') return <Shell><CuratorCompetePanel user={user} onBack={() => setView('menu')} /></Shell>

  const Item = ({ icon, label, onClick, danger, right }) => (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-5 py-4 text-left font-mono text-[12px] uppercase tracking-[0.12em] transition-colors hover:bg-bg ${
        danger ? 'text-ink' : 'text-ink-dim'
      }`}
    >
      {icon}
      <span>{label}</span>
      <span className="ml-auto flex items-center gap-2 text-muted">
        {right}
        <span>▸</span>
      </span>
    </button>
  )
  const canDelete = user.id !== 'curator'

  return (
    <Shell>
      <div className="border border-line-bright bg-panel">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <Avatar alias={user.alias} src={user.avatar} size={40} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-sans text-base font-bold uppercase tracking-tight text-ink">{user.alias}</span>
              {user.verified || user.role === 'admin' ? <VerifiedBadge size={13} /> : null}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{user.email || user.alias}</div>
          </div>
        </div>
        <div className="divide-y divide-line">
          <Item
            icon={<IconSettings size={18} />}
            label={t('profile.editProfile')}
            onClick={() => navigate('/edit-profile')}
          />
          <Item
            icon={<span className="flex w-[18px] justify-center text-[15px] leading-none">@</span>}
            label={t('settings.identity')}
            onClick={() => setView('identity')}
            right={<span className="max-w-[120px] truncate font-mono text-[10px] text-muted">@{user.alias}</span>}
          />
          <Item
            icon={<span className="flex w-[18px] justify-center text-[15px] leading-none">♪</span>}
            label={t('settings.sampleMaker')}
            onClick={() => navigate('/sample-maker')}
            right={
              user.sampleMakerStatus ? (
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{user.sampleMakerStatus}</span>
              ) : null
            }
          />
          <div className="flex w-full items-center gap-3 px-5 py-4 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-dim">
            <IconGlobe size={18} />
            <span>{t('common.language')}</span>
            <span className="ml-auto">
              <LangToggle />
            </span>
          </div>
          <div className="flex w-full items-center gap-3 px-5 py-4 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-dim">
            <span className="flex w-[18px] justify-center text-[15px] leading-none">◐</span>
            <span>{t('settings.theme')}</span>
            <span className="ml-auto">
              <ThemeToggle />
            </span>
          </div>
          <NotificationsRow />
          {user.name || user.dob || user.email ? (
            <Item icon={<IconUser size={18} />} label={t('settings.personalData')} onClick={() => setView('private')} />
          ) : null}
          {user.role === 'listener' || user.role === 'producer' || user.role === 'artist' ? (
            <Item
              icon={<span className="flex w-[18px] justify-center text-[15px] leading-none">⇄</span>}
              label={t('settings.accountType')}
              onClick={() => setView('role')}
              right={<span className="font-mono text-[10px] text-muted">{user.dualRole ? t('role.dual') : t(`role.${user.role}`)}</span>}
            />
          ) : null}
          {isCurator ? (
            <Item
              icon={<span className="flex w-[18px] justify-center text-[15px] leading-none">⚔</span>}
              label={t('settings.compete')}
              onClick={() => setView('compete')}
              right={
                <span className={`font-mono text-[10px] ${user.curatorCompetes ? 'text-ink' : 'text-faint'}`}>
                  {user.curatorCompetes ? t('profile.on') : t('profile.off')}
                </span>
              }
            />
          ) : null}
          {isHouse ? (
            <Item
              icon={<span className="flex w-[18px] justify-center text-[15px] leading-none">⇄</span>}
              label={t('settings.switchAccount')}
              onClick={() => setView('switch')}
            />
          ) : null}
          <Item
            icon={<IconShield size={18} />}
            label={t('profile.twoFactorAuth')}
            onClick={() => setView('2fa')}
            right={
              <span className={`font-mono text-[10px] ${user.twoFactor ? 'text-ink' : 'text-faint'}`}>
                {user.twoFactor ? t('profile.on') : t('profile.off')}
              </span>
            }
          />
          {!standalone ? (
            <Item
              icon={<span className="flex w-[18px] justify-center text-[15px] leading-none">⤓</span>}
              label={t('settings.install')}
              onClick={() => setView('install')}
            />
          ) : null}
          <Item
            icon={<span className="flex w-[18px] justify-center text-[15px] leading-none">?</span>}
            label="Help"
            onClick={() => navigate('/help')}
          />
          <Item icon={<IconLogout size={18} />} label={t('common.logout')} onClick={out} />
          {canDelete ? (
            <Item icon={<IconTrash size={18} />} label={t('profile.deleteAccount')} onClick={() => setView('delete')} danger />
          ) : null}
        </div>
        <div className="px-5 py-3 font-mono text-[10px] leading-relaxed text-muted">
          {t('profile.signedInAs', { who: user.email || user.alias })}
        </div>
      </div>
    </Shell>
  )
}
