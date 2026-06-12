import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { usePWA } from '../context/PWAContext.jsx'
import { useT } from '../i18n/index.jsx'
import Avatar from '../components/Avatar.jsx'
import { UserSafetyMenu } from '../components/Safety.jsx'
import { Btn, inputCls } from '../components/ui.jsx'

function shortAgo(ts) {
  const d = Date.now() - ts
  const m = Math.floor(d / 60000)
  const h = Math.floor(m / 60)
  const day = Math.floor(h / 24)
  if (day > 0) return `${day}d`
  if (h > 0) return `${h}h`
  if (m > 0) return `${m}m`
  return 'now'
}
const clock = (ts) => {
  const d = new Date(ts)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function LoginGate() {
  const t = useT()
  return (
    <div className="mx-auto max-w-[760px] px-4 py-24 text-center sm:px-6">
      <div className="font-mono text-[12px] text-muted">{t('messages.loginToMessage')}</div>
      <div className="mt-6 flex justify-center gap-3">
        <Btn to="/login" variant="solid">{t('common.login')}</Btn>
        <Btn to="/signup" variant="ghost">{t('common.signup')}</Btn>
      </div>
    </div>
  )
}

export default function Messages() {
  const { alias } = useParams()
  return alias ? <Thread alias={alias} /> : <Inbox />
}

// ----- inbox -----------------------------------------------------------------
function Inbox() {
  const { fetchThreads, currentUser } = useApp()
  const t = useT()
  const navigate = useNavigate()
  const [threads, setThreads] = useState([])
  const [tab, setTab] = useState('primary')

  useEffect(() => {
    let alive = true
    fetchThreads().then((r) => {
      if (alive && r.ok) setThreads(r.threads || [])
    })
    return () => {
      alive = false
    }
  }, [fetchThreads])

  if (!currentUser) return <LoginGate />

  const primary = threads.filter((x) => !x.isRequest)
  const requests = threads.filter((x) => x.isRequest)
  const list = tab === 'primary' ? primary : requests

  const TabBtn = ({ id, label, count, dot }) => (
    <button
      onClick={() => setTab(id)}
      className={`relative flex items-center gap-2 border-b-2 px-1 pb-2.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
        tab === id ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
      }`}
    >
      {label}
      <span className="text-faint tnum">{count}</span>
      {dot ? <span className="block h-1.5 w-1.5 bg-ink" /> : null}
    </button>
  )

  return (
    <div className="mx-auto max-w-[760px] px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex items-baseline gap-4 border-b border-line pb-4">
        <span className="font-mono text-[12px] text-faint tnum">M0</span>
        <h1 className="font-sans text-[clamp(2rem,6vw,3.5rem)] font-bold uppercase leading-none tracking-tighter">
          {t('messages.title')}
        </h1>
      </div>
      <p className="mt-4 font-mono text-[11px] text-muted">{t('messages.networkHint')}</p>

      <div className="mt-8 flex gap-6">
        <TabBtn id="primary" label={t('messages.primary')} count={primary.length} />
        <TabBtn id="requests" label={t('messages.requests')} count={requests.length} dot={requests.some((r) => r.unread > 0)} />
      </div>

      <div className="mt-4 divide-y divide-line border border-line bg-panel">
        {list.length ? (
          list.map((th) => (
            <button
              key={th.user.alias}
              onClick={() => navigate(`/messages/${encodeURIComponent(th.user.alias)}`)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bg"
            >
              <Avatar alias={th.user.alias} src={th.user.avatar} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[12px] text-ink">@{th.user.alias}</span>
                  <span className="shrink-0 font-mono text-[10px] text-faint">{shortAgo(th.last.createdAt)}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className={`truncate font-mono text-[11px] ${th.unread ? 'text-ink' : 'text-muted'}`}>
                    {th.last.mine ? t('messages.you') : ''}
                    {th.last.battleId && !th.last.body ? `↗ ${t('messages.sharedBattle')}` : th.last.body}
                  </span>
                  {th.unread > 0 ? <span className="ml-auto block h-2 w-2 shrink-0 bg-ink" /> : null}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="px-4 py-10 text-center">
            <p className="font-mono text-[12px] text-muted">
              {tab === 'primary' ? t('messages.empty') : t('messages.emptyRequests')}
            </p>
            {tab === 'primary' ? (
              <p className="mt-2 font-mono text-[11px] text-faint">{t('messages.emptyHint')}</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

// ----- one conversation ------------------------------------------------------
function BattlePreview({ battleId }) {
  const { getBattle } = useApp()
  const t = useT()
  const b = getBattle(battleId)
  if (!b) {
    return <span className="font-mono text-[11px] text-muted">↗ {t('messages.sharedBattle')}</span>
  }
  return (
    <Link
      to={`/battles/${b.id}`}
      className="block border border-line-bright bg-bg px-3 py-2.5 transition-colors hover:border-ink"
    >
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
        {t(`kind.${b.kind}`)} · {t(`status.${b.status}`)}
      </div>
      <div className="mt-1 font-sans text-[14px] font-bold uppercase leading-tight tracking-tight text-ink">
        {b.title}
      </div>
    </Link>
  )
}

function Thread({ alias }) {
  const { fetchThread, sendMessage, refresh, currentUser } = useApp()
  const { standalone } = usePWA()
  const t = useT()
  const [data, setData] = useState(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const endRef = useRef(null)
  const didRefresh = useRef(false)

  const load = useCallback(
    async (initial) => {
      const r = await fetchThread(alias)
      if (r.ok) {
        setData(r)
        if (initial && !didRefresh.current) {
          didRefresh.current = true
          refresh() // opening marks incoming read → sync the unread badge
        }
      } else setErr(r.error)
    },
    [alias, fetchThread, refresh],
  )

  useEffect(() => {
    didRefresh.current = false
    load(true)
    const id = setInterval(() => load(false), 4000)
    return () => clearInterval(id)
  }, [load])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [data?.messages?.length])

  if (!currentUser) return <LoginGate />

  const onSend = async (e) => {
    e.preventDefault()
    const text = body.trim()
    if (!text) return
    setSending(true)
    setErr('')
    const r = await sendMessage(alias, text)
    setSending(false)
    if (r.ok) {
      setBody('')
      load(false)
    } else setErr(r.error)
  }

  const u = data?.user
  return (
    <div className="mx-auto max-w-[760px] px-4 sm:px-6">
      <div className="sticky top-0 z-10 -mx-4 flex items-center gap-3 border-b border-line bg-black/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Link to="/messages" className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ink">
          ◂ {t('messages.inbox')}
        </Link>
        {u ? (
          <>
            <Link to={`/profile/${encodeURIComponent(u.alias)}`} className="ml-1 flex items-center gap-2">
              <Avatar alias={u.alias} src={u.avatar} size={28} />
              <span className="font-mono text-[12px] text-ink">@{u.alias}</span>
            </Link>
            <UserSafetyMenu user={u} small className="ml-auto" />
          </>
        ) : null}
      </div>

      <div className="space-y-2 py-5">
        {data && data.messages.length ? (
          data.messages.map((m) => (
            <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%] space-y-1.5">
                {m.battleId ? <BattlePreview battleId={m.battleId} /> : null}
                {m.body ? (
                  <div
                    className={`border px-3 py-2 ${
                      m.mine ? 'border-ink bg-ink text-bg' : 'border-line bg-panel text-ink'
                    }`}
                  >
                    <div className="font-sans text-[14px] leading-snug">{m.body}</div>
                    <div className={`mt-1 font-mono text-[9px] ${m.mine ? 'text-bg/60' : 'text-faint'}`}>
                      {clock(m.createdAt)}
                    </div>
                  </div>
                ) : (
                  <div className={`font-mono text-[9px] text-faint ${m.mine ? 'text-right' : ''}`}>
                    {clock(m.createdAt)}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="py-12 text-center font-mono text-[12px] text-muted">{t('messages.threadEmpty')}</p>
        )}
        <div ref={endRef} />
      </div>

      {err ? (
        <div className="mb-2 border border-line-bright px-3 py-2 font-mono text-[11px] text-ink">! {err}</div>
      ) : null}

      <form
        onSubmit={onSend}
        className="sticky -mx-4 flex gap-2 border-t border-line bg-black/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"
        style={{ bottom: standalone ? 'calc(env(safe-area-inset-bottom) + 90px)' : 0 }}
      >
        <input
          className={`${inputCls} flex-1`}
          placeholder={t('messages.placeholder')}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
        />
        <Btn type="submit" variant="solid" disabled={sending || !body.trim()}>
          {t('messages.send')}
        </Btn>
      </form>
    </div>
  )
}
