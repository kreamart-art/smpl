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
  const { updateProfile } = useApp()
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
    await updateRole(role)
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

export default function Settings() {
  const { currentUser, logout, isHouse } = useApp()
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
          onClick={() => navigate(`/profile/${encodeURIComponent(user.alias)}`)}
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink"
        >
          ◂ {t('common.profile')}
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
            onClick={() => navigate(`/profile/${encodeURIComponent(user.alias)}?edit=1`)}
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
              right={<span className="font-mono text-[10px] text-muted">{t(`role.${user.role}`)}</span>}
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
