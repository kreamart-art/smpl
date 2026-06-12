import Waveform from './Waveform.jsx'
import Avatar from './Avatar.jsx'
import { useT } from '../i18n/index.jsx'

// A poster sized for Instagram (story 9:16 / post 4:5), rendered at true pixel
// size so html-to-image can export it 1:1. SMPL aesthetic: black, mono, a
// waveform, the wordmark. Three shapes: battle / profile / win.
export default function ShareCard({ cardRef, kind, data, format = 'story', logoSrc = '/logo.png' }) {
  const t = useT()
  const H = format === 'story' ? 1920 : 1350

  const tag =
    kind === 'win'
      ? `★ ${t('share.winner')}`
      : kind === 'profile'
        ? t(`role.${data.role}`)
        : t(`kind.${data.kind}`)

  return (
    <div
      ref={cardRef}
      style={{ width: 1080, height: H }}
      className="relative flex flex-col overflow-hidden bg-black text-ink"
    >
      {/* light + grid + vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(120% 60% at 50% 0%, rgba(255,255,255,0.09), rgba(255,255,255,0) 55%)' }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)',
          backgroundSize: '92px 92px',
        }}
      />
      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 0 320px 70px rgba(0,0,0,0.92)' }} />

      <div
        className="relative flex h-full flex-col justify-between"
        style={{ padding: format === 'story' ? '190px 90px 400px' : '90px' }}
      >
        {/* header */}
        <div className="flex items-center justify-between">
          <img src={logoSrc} alt="SMPL" style={{ height: 60, width: 'auto' }} />
          <span className="border border-line-bright font-mono uppercase text-ink-dim" style={{ padding: '12px 22px', fontSize: 26, letterSpacing: '0.2em' }}>
            {tag}
          </span>
        </div>

        {/* middle */}
        {kind === 'battle' && (
          <div className="flex flex-col" style={{ gap: 26 }}>
            <div className="font-mono uppercase text-muted" style={{ fontSize: 30, letterSpacing: '0.2em' }}>
              {t('share.curatedBy', { alias: data.curator })}
              {data.genre ? <span className="text-ink"> · {data.genre}</span> : null}
            </div>
            <h1 className="font-sans font-bold uppercase tracking-tighter" style={{ fontSize: 124, lineHeight: 0.84 }}>
              {data.title}
            </h1>
            {data.sampleLine ? (
              <div className="font-mono text-ink-dim" style={{ fontSize: 34 }}>
                {data.sampleLine}
              </div>
            ) : null}
            {data.description ? (
              <div className="font-sans text-muted" style={{ fontSize: 32, lineHeight: 1.34 }}>
                {data.description}
              </div>
            ) : null}
            <div
              className="inline-flex w-fit items-center border border-line-bright font-mono uppercase text-ink"
              style={{ gap: 14, padding: '12px 22px', fontSize: 26, letterSpacing: '0.18em' }}
            >
              <span className="block bg-ink" style={{ width: 14, height: 14 }} />
              {t(`status.${data.status}`)}
            </div>
          </div>
        )}

        {kind === 'profile' && (
          <div className="flex flex-col items-start" style={{ gap: 44 }}>
            <Avatar alias={data.alias} src={data.avatar} size={300} />
            <div>
              <div className="font-mono uppercase text-muted" style={{ fontSize: 30, letterSpacing: '0.22em' }}>
                {data.location ? `◍ ${data.location}` : t(`role.${data.role}`)}
              </div>
              <h1 className="font-sans font-bold uppercase tracking-tighter" style={{ fontSize: 150, lineHeight: 0.84 }}>
                {data.alias}
              </h1>
            </div>
            <div className="flex" style={{ gap: 70 }}>
              <Stat label={t('common.followers')} value={data.followers} />
              <Stat label={data.statLabel} value={data.statValue} />
            </div>
          </div>
        )}

        {kind === 'win' && (
          <div className="flex flex-col" style={{ gap: 30 }}>
            <div className="font-mono uppercase text-muted" style={{ fontSize: 30, letterSpacing: '0.24em' }}>
              {t('share.crownedOn', { title: data.title })}
            </div>
            <h1 className="font-sans font-bold uppercase tracking-tighter" style={{ fontSize: 168, lineHeight: 0.8 }}>
              @{data.alias}
            </h1>
            <div className="font-mono text-ink-dim" style={{ fontSize: 40 }}>
              {t('share.wonVotes', { n: data.votes })}
            </div>
          </div>
        )}

        {/* footer — brand block in the safe zone (always visible over IG UI) */}
        <div>
          <div style={{ height: 140, marginBottom: 36 }}>
            <Waveform seed={data.seed} bars={84} height={140} progress={0.46} baseClass="bg-line-bright" playedClass="bg-ink" />
          </div>
          <div className="flex items-center justify-between border-t border-line-bright" style={{ paddingTop: 34, gap: 24 }}>
            <img src={logoSrc} alt="SMPL" style={{ height: 56, width: 'auto' }} />
            <div className="text-right">
              <div className="font-mono uppercase text-ink-dim" style={{ fontSize: 28, letterSpacing: '0.14em' }}>
                {data.cta}
              </div>
              <div className="font-mono text-muted" style={{ fontSize: 28, letterSpacing: '0.1em' }}>
                smpl.artnomad.nl
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="font-mono uppercase text-faint" style={{ fontSize: 24, letterSpacing: '0.2em' }}>
        {label}
      </div>
      <div className="font-mono tnum text-ink" style={{ fontSize: 96, lineHeight: 0.9 }}>
        {value}
      </div>
    </div>
  )
}
