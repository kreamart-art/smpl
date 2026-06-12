import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { usePWA } from '../context/PWAContext.jsx'
import { useT } from '../i18n/index.jsx'
import Avatar from '../components/Avatar.jsx'
import VerifiedBadge from '../components/VerifiedBadge.jsx'
import { UserSafetyMenu } from '../components/Safety.jsx'
import { IconImage, IconMic } from '../components/icons.jsx'
import { Btn, inputCls } from '../components/ui.jsx'
import { roleLabel } from '../data/kind.js'

const REACTIONS = ['❤️', '🔥', '😂', '👍', '😮', '😢', '🙏']

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
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
function dayKey(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}
function dayLabel(ts, t) {
  const d = new Date(ts)
  const now = new Date()
  const y = new Date(now)
  y.setDate(now.getDate() - 1)
  if (sameDay(d, now)) return t('messages.today')
  if (sameDay(d, y)) return t('messages.yesterday')
  return d
    .toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
    .toUpperCase()
}

// Shrink a picked photo before upload so DMs stay light.
function downscaleImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const max = 1600
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        c.getContext('2d').drawImage(img, 0, 0, w, h)
        c.toBlob((blob) => resolve(blob ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : file), 'image/jpeg', 0.85)
      }
      img.onerror = () => resolve(file)
      img.src = reader.result
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
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
    const reload = () => fetchThreads().then((r) => r.ok && setThreads(r.threads || []))
    window.addEventListener('smpl:refresh', reload)
    return () => {
      alive = false
      window.removeEventListener('smpl:refresh', reload)
    }
  }, [fetchThreads])

  if (!currentUser) return <LoginGate />

  const primary = threads.filter((x) => !x.isRequest)
  const requests = threads.filter((x) => x.isRequest)
  const list = tab === 'primary' ? primary : requests

  const lastLabel = (last) => {
    if (last.kind === 'deleted') return `↺ ${t('messages.deleted')}`
    if (last.kind === 'image') return `▣ ${t('messages.photo')}`
    if (last.kind === 'audio') return `▶ ${t('messages.voiceClip')}`
    if (last.kind === 'battle') return `↗ ${t('messages.sharedBattle')}`
    if (last.kind === 'profile') return `↗ ${t('messages.sharedProfile')}`
    if (last.kind === 'event') return `↗ ${t('messages.sharedEvent')}`
    return last.body
  }

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
                    {lastLabel(th.last)}
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

// ----- shared battle card in a thread ---------------------------------------
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

// A shared profile card in a thread.
function ProfilePreview({ alias }) {
  const { getUserByAlias } = useApp()
  const u = getUserByAlias(alias)
  if (!u) return <span className="font-mono text-[11px] text-muted">↗ @{alias}</span>
  return (
    <Link
      to={`/profile/${encodeURIComponent(u.alias)}`}
      className="flex items-center gap-3 border border-line-bright bg-bg px-3 py-2.5 transition-colors hover:border-ink"
    >
      <Avatar alias={u.alias} src={u.avatar} size={38} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-sans text-[14px] font-bold uppercase tracking-tight text-ink">@{u.alias}</span>
          {u.verified || u.role === 'admin' ? <VerifiedBadge size={12} /> : null}
        </div>
        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
          {roleLabel(u.role)}
          {u.location ? ` · ${u.location}` : ''}
        </div>
      </div>
    </Link>
  )
}

// ----- a voice clip player ---------------------------------------------------
function AudioClip({ src, mine }) {
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [p, setP] = useState(0)
  useEffect(() => {
    const a = ref.current
    if (!a) return
    const onT = () => setP(a.duration ? a.currentTime / a.duration : 0)
    const onEnd = () => {
      setPlaying(false)
      setP(0)
    }
    a.addEventListener('timeupdate', onT)
    a.addEventListener('ended', onEnd)
    return () => {
      a.removeEventListener('timeupdate', onT)
      a.removeEventListener('ended', onEnd)
    }
  }, [])
  const toggle = () => {
    const a = ref.current
    if (!a) return
    if (playing) {
      a.pause()
      setPlaying(false)
    } else {
      a.play()
      setPlaying(true)
    }
  }
  return (
    <div className="flex items-center gap-2 py-0.5">
      <audio ref={ref} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        className={`flex h-7 w-7 shrink-0 items-center justify-center border text-[11px] ${
          mine ? 'border-bg/40 text-bg' : 'border-line-bright text-ink'
        }`}
      >
        {playing ? '❚❚' : '▶'}
      </button>
      <div className={`h-1 w-28 ${mine ? 'bg-bg/30' : 'bg-line'}`}>
        <div className={`h-full ${mine ? 'bg-bg' : 'bg-ink'}`} style={{ width: `${p * 100}%` }} />
      </div>
    </div>
  )
}

// ----- one conversation ------------------------------------------------------
function Thread({ alias }) {
  const { fetchThread, sendMessage, reactMessage, unsendMessage, uploadImage, uploadAudio, refresh, currentUser } = useApp()
  const { standalone } = usePWA()
  const t = useT()
  const [data, setData] = useState(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const [replyTo, setReplyTo] = useState(null) // a message object to quote
  const [activeMsg, setActiveMsg] = useState(null) // message id with its action bar open
  const [recording, setRecording] = useState(false)
  const [recSecs, setRecSecs] = useState(0)
  const fileRef = useRef(null)
  const endRef = useRef(null)
  const recRef = useRef(null)
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
    const r = await sendMessage(alias, text, { replyTo: replyTo?.id })
    setSending(false)
    if (r.ok) {
      setBody('')
      setReplyTo(null)
      load(false)
    } else setErr(r.error)
  }

  const onPickImage = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setSending(true)
    setErr('')
    const small = await downscaleImage(file)
    const up = await uploadImage(small)
    if (up.ok && up.url) {
      const r = await sendMessage(alias, '', { imageUrl: up.url, replyTo: replyTo?.id })
      if (r.ok) {
        setReplyTo(null)
        load(false)
      } else setErr(r.error)
    } else setErr(up.error || t('messages.uploadFailed'))
    setSending(false)
  }

  const startRec = async () => {
    setErr('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      const chunks = []
      mr.ondataavailable = (ev) => {
        if (ev.data.size) chunks.push(ev.data)
      }
      mr.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop())
        clearInterval(recRef.current?.timer)
        if (recRef.current?.cancelled) return
        const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' })
        const ext = (mr.mimeType || '').includes('mp4') ? 'm4a' : 'webm'
        const file = new File([blob], `clip.${ext}`, { type: blob.type })
        setSending(true)
        const up = await uploadAudio(file)
        if (up.ok && up.url) {
          const r = await sendMessage(alias, '', { audioUrl: up.url, replyTo: replyTo?.id })
          if (r.ok) {
            setReplyTo(null)
            load(false)
          } else setErr(r.error)
        } else setErr(up.error || t('messages.uploadFailed'))
        setSending(false)
      }
      const timer = setInterval(() => setRecSecs((s) => s + 1), 1000)
      recRef.current = { mr, stream, timer, cancelled: false }
      mr.start()
      setRecording(true)
      setRecSecs(0)
    } catch {
      setErr(t('messages.micDenied'))
    }
  }
  const stopRec = (cancel) => {
    const r = recRef.current
    if (!r?.mr) return
    r.cancelled = !!cancel
    r.mr.stop()
    setRecording(false)
  }

  const react = async (id, emoji) => {
    setActiveMsg(null)
    await reactMessage(id, emoji)
    load(false)
  }
  const unsend = async (id) => {
    setActiveMsg(null)
    await unsendMessage(id)
    load(false)
  }

  const u = data?.user
  const msgs = data?.messages || []
  const lastMineId = [...msgs].reverse().find((m) => m.mine && !m.deleted)?.id
  return (
    <div
      className="mx-auto flex w-full max-w-[760px] flex-col px-4 sm:px-6"
      style={{
        height: standalone
          ? 'calc(100dvh - 134px - env(safe-area-inset-top) - env(safe-area-inset-bottom))'
          : undefined,
        minHeight: standalone ? undefined : 'calc(100dvh - 140px)',
      }}
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-line py-3">
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

      {/* messages grow + scroll; with few messages they sit just above the composer */}
      <div className="-mx-4 flex-1 overflow-y-auto px-4 sm:-mx-6 sm:px-6" onClick={() => setActiveMsg(null)}>
        <div className="flex min-h-full flex-col justify-end gap-1 py-4">
          {msgs.length ? (
            msgs.map((m, i) => {
              const prev = msgs[i - 1]
              const next = msgs[i + 1]
              const newDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt)
              const groupEnd = !next || next.mine !== m.mine || dayKey(next.createdAt) !== dayKey(m.createdAt)
              const open = activeMsg === m.id
              const av = m.mine ? currentUser : u
              return (
                <div key={m.id}>
                  {newDay ? (
                    <div className="my-3 flex items-center justify-center">
                      <span className="border border-line bg-panel px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                        {dayLabel(m.createdAt, t)}
                      </span>
                    </div>
                  ) : null}
                  <div className={`flex items-end gap-2 ${m.mine ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* avatar gutter — only the last bubble of a run shows it */}
                    <div className="w-7 shrink-0">
                      {groupEnd ? <Avatar alias={av?.alias || '?'} src={av?.avatar} size={28} /> : null}
                    </div>
                    <div className={`flex max-w-[78%] flex-col ${m.mine ? 'items-end' : 'items-start'}`}>
                      {m.deleted ? (
                        <div className="border border-dashed border-line px-3 py-2 font-mono text-[11px] italic text-faint">
                          ↺ {t('messages.deleted')}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveMsg(open ? null : m.id)
                          }}
                          className="block text-left"
                        >
                          {m.reply ? (
                            <div
                              className={`mb-0.5 max-w-full truncate border-l-2 px-2 py-0.5 font-mono text-[10px] ${
                                m.mine ? 'border-ink/40 text-muted' : 'border-line-bright text-muted'
                              }`}
                            >
                              {m.reply.kind === 'image'
                                ? `▣ ${t('messages.photo')}`
                                : m.reply.kind === 'audio'
                                  ? `▶ ${t('messages.voiceClip')}`
                                  : m.reply.kind === 'deleted'
                                    ? `↺ ${t('messages.deleted')}`
                                    : m.reply.snippet}
                            </div>
                          ) : null}
                          <div className="space-y-1.5">
                            {m.battleId ? <BattlePreview battleId={m.battleId} /> : null}
                            {m.shareKind === 'profile' ? <ProfilePreview alias={m.shareRef} /> : null}
                            {m.shareKind === 'event' ? (
                              <span className="font-mono text-[11px] text-muted">↗ {t('messages.sharedEvent')}</span>
                            ) : null}
                            {m.imageUrl ? (
                              <img
                                src={m.imageUrl}
                                alt=""
                                className="max-h-72 w-auto max-w-full border border-line"
                                loading="lazy"
                              />
                            ) : null}
                            {m.audioUrl ? (
                              <div className={`border px-2 ${m.mine ? 'border-ink bg-ink' : 'border-line bg-panel'}`}>
                                <AudioClip src={m.audioUrl} mine={m.mine} />
                              </div>
                            ) : null}
                            {m.body ? (
                              <div
                                className={`border px-3 py-2 ${
                                  m.mine ? 'border-ink bg-ink text-bg' : 'border-line bg-panel text-ink'
                                }`}
                              >
                                <div className="whitespace-pre-wrap break-words font-sans text-[14px] leading-snug">
                                  {m.body}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </button>
                      )}

                      {/* reactions on the bubble */}
                      {m.reactions?.length ? (
                        <div className={`mt-0.5 flex flex-wrap gap-1 ${m.mine ? 'justify-end' : ''}`}>
                          {m.reactions.map((r) => (
                            <button
                              key={r.emoji}
                              onClick={(e) => {
                                e.stopPropagation()
                                react(m.id, r.emoji)
                              }}
                              className={`flex items-center gap-1 border px-1.5 py-0.5 text-[11px] leading-none ${
                                r.mine ? 'border-ink bg-bg' : 'border-line bg-panel'
                              }`}
                            >
                              <span>{r.emoji}</span>
                              {r.count > 1 ? <span className="font-mono text-[9px] text-muted">{r.count}</span> : null}
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {/* tap-to-open action bar: react / reply / unsend */}
                      {open && !m.deleted ? (
                        <div
                          className={`mt-1 flex flex-wrap items-center gap-1 border border-line-bright bg-panel px-1.5 py-1 ${
                            m.mine ? 'justify-end' : ''
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => react(m.id, emoji)}
                              className="px-1 text-[15px] leading-none transition-transform hover:scale-125"
                            >
                              {emoji}
                            </button>
                          ))}
                          <span className="mx-0.5 h-4 w-px bg-line" />
                          <button
                            onClick={() => {
                              setReplyTo(m)
                              setActiveMsg(null)
                            }}
                            className="px-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-ink"
                          >
                            ↩ {t('messages.reply')}
                          </button>
                          {m.mine ? (
                            <button
                              onClick={() => unsend(m.id)}
                              className="px-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-ink"
                            >
                              🗑 {t('messages.unsend')}
                            </button>
                          ) : null}
                        </div>
                      ) : null}

                      {/* timestamp on the last bubble of a run */}
                      {groupEnd ? (
                        <div className="mt-0.5 font-mono text-[9px] text-faint">
                          {clock(m.createdAt)}
                          {m.id === lastMineId && m.readAt ? ` · ${t('messages.seen')}` : ''}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="py-12 text-center font-mono text-[12px] text-muted">{t('messages.threadEmpty')}</p>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {err ? (
        <div className="mt-2 shrink-0 border border-line-bright px-3 py-2 font-mono text-[11px] text-ink">! {err}</div>
      ) : null}

      {/* reply preview above the composer */}
      {replyTo ? (
        <div className="flex shrink-0 items-center gap-2 border-t border-line bg-panel px-3 py-2">
          <span className="border-l-2 border-line-bright pl-2 font-mono text-[10px] text-muted">
            ↩ {replyTo.imageUrl ? `▣ ${t('messages.photo')}` : replyTo.audioUrl ? `▶ ${t('messages.voiceClip')}` : (replyTo.body || '').slice(0, 60)}
          </span>
          <button onClick={() => setReplyTo(null)} className="ml-auto font-mono text-[12px] text-faint hover:text-ink">
            ✕
          </button>
        </div>
      ) : null}

      {recording ? (
        <div className="flex shrink-0 items-center gap-3 border-t border-line py-3">
          <span className="pulse-dot text-[12px] text-ink">●</span>
          <span className="font-mono text-[12px] text-ink tnum">
            {Math.floor(recSecs / 60)}:{String(recSecs % 60).padStart(2, '0')}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{t('messages.recording')}</span>
          <button
            onClick={() => stopRec(true)}
            className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-muted hover:text-ink"
          >
            {t('common.cancel')}
          </button>
          <Btn type="button" variant="solid" onClick={() => stopRec(false)}>
            {t('messages.send')}
          </Btn>
        </div>
      ) : (
        <form onSubmit={onSend} className="flex shrink-0 items-center gap-2 border-t border-line py-3">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={sending}
            aria-label={t('messages.photo')}
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-line-bright text-ink transition-colors hover:border-ink disabled:opacity-40"
          >
            <IconImage size={18} />
          </button>
          <button
            type="button"
            onClick={startRec}
            disabled={sending}
            aria-label={t('messages.voiceClip')}
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-line-bright text-ink transition-colors hover:border-ink disabled:opacity-40"
          >
            <IconMic size={18} />
          </button>
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
      )}
    </div>
  )
}
