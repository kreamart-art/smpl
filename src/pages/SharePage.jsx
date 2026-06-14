import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { STATUS } from '../data/status.js'
import ShareCard from '../components/ShareCard.jsx'
import { Btn } from '../components/ui.jsx'

export default function SharePage() {
  const { kind, id } = useParams()
  const navigate = useNavigate()
  const t = useT()
  const app = useApp()
  const { loading } = app
  const cardRef = useRef(null)
  const wrapRef = useRef(null)
  const [format, setFormat] = useState('story')
  const [scale, setScale] = useState(0.33)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  // Inline the wordmark as a data URL so it bakes into the exported PNG
  // (a plain <img src="/logo.png"> can get dropped by html-to-image in prod).
  const [logoUrl, setLogoUrl] = useState('/logo.png')
  // QR of the deep link, baked into the card so the poster itself is scannable.
  const [qrUrl, setQrUrl] = useState('')

  useEffect(() => {
    let alive = true
    fetch('/logo.png')
      .then((r) => r.blob())
      .then(
        (b) =>
          new Promise((res) => {
            const fr = new FileReader()
            fr.onload = () => res(fr.result)
            fr.readAsDataURL(b)
          }),
      )
      .then((url) => {
        if (alive && typeof url === 'string') setLogoUrl(url)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // Deep link to the battle/profile — the card is an image, so to make it
  // tappable the user pastes this into an Instagram Link sticker.
  const deepLink = `${typeof window !== 'undefined' ? window.location.origin : ''}${
    kind === 'profile' ? `/profile/${encodeURIComponent(id)}` : `/battles/${id}`
  }`
  // Encode the deep link as a QR (dark-on-white so any camera reads it).
  useEffect(() => {
    let alive = true
    import('qrcode')
      .then((QR) => QR.toDataURL(deepLink, { margin: 1, width: 280, color: { dark: '#000000', light: '#ffffff' } }))
      .then((url) => {
        if (alive) setQrUrl(url)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [deepLink])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(deepLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    const measure = () => {
      if (wrapRef.current) setScale(Math.min(1, wrapRef.current.clientWidth / 1080))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const battleCta = useCallback(
    (status) =>
      status === STATUS.VOTING_PHASE
        ? t('share.cta.vote')
        : status === STATUS.OPEN_FOR_SIGNUP
          ? t('share.cta.join')
          : t('share.cta.listen'),
    [t],
  )

  // ----- resolve the card data from app state -----
  let data = null
  if (!loading) {
    if (kind === 'battle' || kind === 'win') {
      const b = app.getBattle(id)
      if (b && kind === 'battle') {
        const desc = (b.description || '').trim()
        data = {
          kind: b.kind,
          title: b.title,
          curator: app.getUser(b.curatorId)?.alias || 'SMPL',
          sampleLine: b.sampleRevealed ? `${b.sampleArtist} — ${b.sampleSong}` : null,
          genre: b.genre || '',
          description: desc.length > 150 ? `${desc.slice(0, 150).trim()}…` : desc,
          status: b.status,
          seed: b.id,
          cta: battleCta(b.status),
        }
      } else if (b && kind === 'win' && b.status === STATUS.WINNER_DECLARED) {
        const ranked = app.rankedSubmissions(b.id)
        const winSub = b.winnerSubmissionId ? ranked.find((s) => s.id === b.winnerSubmissionId) : ranked[0]
        const alias = winSub ? app.getUser(winSub.producerId)?.alias : null
        if (alias) data = { alias, title: b.title, votes: winSub.votes || 0, seed: winSub.id, cta: t('share.cta.listen') }
      }
    } else if (kind === 'profile') {
      const u = app.getUserByAlias(id)
      if (u) {
        const isCur = u.role === 'curator'
        const count = isCur ? app.curatorStats(u.id).count : app.producerStats(u.id).played
        data = {
          alias: u.alias,
          avatar: u.avatar,
          role: u.role,
          location: u.location,
          followers: app.followerCount(u.id),
          statLabel: t('common.battles'),
          statValue: count,
          seed: u.id,
          cta: t('share.cta.follow'),
        }
      }
    }
  }

  const render = async () => {
    const { toPng } = await import('html-to-image')
    if (document.fonts?.ready) await document.fonts.ready
    // NB: no cacheBust — it appends a query string that corrupts the inlined
    // data-URL logo (and we inline everything, so there's nothing to bust).
    return toPng(cardRef.current, { pixelRatio: 1, backgroundColor: '#000000' })
  }

  const onDownload = async () => {
    setBusy(true)
    try {
      const url = await render()
      const a = document.createElement('a')
      a.href = url
      a.download = `SMPL-${kind}.png`
      a.click()
    } catch {
      /* ignore */
    } finally {
      setBusy(false)
    }
  }

  const onShare = async () => {
    setBusy(true)
    // pre-copy the deep link so it's ready to paste into an IG Link sticker
    try {
      await navigator.clipboard.writeText(deepLink)
    } catch {
      /* ignore */
    }
    try {
      const url = await render()
      const blob = await (await fetch(url)).blob()
      const file = new File([blob], `SMPL-${kind}.png`, { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'SMPL' })
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = `SMPL-${kind}.png`
        a.click()
      }
    } catch {
      /* user dismissed / unsupported */
    } finally {
      setBusy(false)
    }
  }

  const H = format === 'story' ? 1920 : 1350

  return (
    <div className="min-h-screen bg-bg" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
      <div className="mx-auto flex max-w-[520px] flex-col px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ink">
            ◂ {t('common.back')}
          </button>
          <Link to="/" aria-label="SMPL — home">
            <img src="/logo.png" alt="SMPL" className="logo-chrome h-5 w-auto" />
          </Link>
        </div>

        <h1 className="mt-6 font-sans text-2xl font-bold uppercase tracking-tight">{t('share.title')}</h1>

        {loading ? (
          <p className="mt-10 font-mono text-[12px] text-muted">{t('common.loading')}</p>
        ) : !data ? (
          <div className="mt-10">
            <p className="font-mono text-[12px] text-muted">{t('share.notFound')}</p>
            <div className="mt-6">
              <Btn to="/battles" variant="ghost">{t('common.battles')}</Btn>
            </div>
          </div>
        ) : (
          <>
            {/* format toggle */}
            <div className="mt-5 inline-flex w-fit border border-line">
              {['story', 'post'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                    format === f ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
                  }`}
                >
                  {t(`share.${f}`)}
                </button>
              ))}
            </div>

            {/* preview (card scaled down; export uses the true 1080px node) */}
            <div ref={wrapRef} className="mt-5 w-full">
              <div
                className="mx-auto border border-line-bright"
                style={{ width: 1080 * scale, height: H * scale, overflow: 'hidden' }}
              >
                <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 1080 }}>
                  <ShareCard
                    cardRef={cardRef}
                    kind={kind}
                    data={data}
                    format={format}
                    logoSrc={logoUrl}
                    qrSrc={qrUrl}
                    link={deepLink.replace(/^https?:\/\//, '')}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Btn onClick={onShare} variant="solid" size="lg" disabled={busy}>
                {busy ? t('share.generating') : `↑ ${t('share.shareBtn')}`}
              </Btn>
              <Btn onClick={onDownload} variant="ghost" size="lg" disabled={busy}>
                ↓ {t('share.download')}
              </Btn>
              <Btn onClick={copyLink} variant="ghost" size="lg">
                {copied ? t('share.linkCopied') : `↗ ${t('share.copyLink')}`}
              </Btn>
            </div>
            <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted">{t('share.hint')}</p>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-faint">{t('share.linkHint')}</p>
          </>
        )}
      </div>
    </div>
  )
}
