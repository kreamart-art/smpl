// /smpl/src/pages/ClipPage.jsx
//
// A single waveform clip on its own page (opened from the profile grid). Shows
// the full 9:16 video with controls, the producer, the battle tag and a way back
// to the battle and profile. SMPL identity: black, mono, hairline rules.
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { mediaUrl } from '../api.js'
import Avatar from '../components/Avatar.jsx'
import VerifiedBadge from '../components/VerifiedBadge.jsx'
import { Btn } from '../components/ui.jsx'
import { useT, useI18n } from '../i18n/index.jsx'

export default function ClipPage() {
  const { id } = useParams()
  const { fetchWaveformVideo } = useApp()
  const t = useT()
  const { lang } = useI18n()
  const nl = lang === 'nl'
  const [data, setData] = useState(undefined) // undefined = loading, null = not found
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    fetchWaveformVideo(id).then((r) => {
      if (alive) setData(r.ok ? r : null)
    })
    return () => {
      alive = false
    }
  }, [id, fetchWaveformVideo])

  if (data === undefined) {
    return (
      <div className="mx-auto max-w-[480px] px-4 py-24 text-center">
        <div className="font-mono text-[12px] uppercase tracking-[0.2em] text-muted">{nl ? 'Laden…' : 'Loading…'}</div>
      </div>
    )
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-[480px] px-4 py-24 text-center">
        <div className="font-mono text-sm text-muted">{nl ? 'Clip niet gevonden.' : 'Clip not found.'}</div>
        <div className="mt-6">
          <Btn to="/battles" variant="ghost">
            {t('battleDetail.backToBattles')}
          </Btn>
        </div>
      </div>
    )
  }

  const { video, producer } = data
  const fname = `smpl-${(producer?.alias || 'clip').toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'clip'}.mp4`
  const grabBlob = async () => (await fetch(mediaUrl(video.url))).blob()
  const downloadClip = async () => {
    const b = await grabBlob()
    const url = URL.createObjectURL(b)
    const a = document.createElement('a')
    a.href = url
    a.download = fname
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
  const shareClip = async () => {
    setBusy(true)
    try {
      const file = new File([await grabBlob()], fname, { type: 'video/mp4' })
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'SMPL' })
      else await downloadClip()
    } catch {
      /* cancelled */
    }
    setBusy(false)
  }
  return (
    <div className="mx-auto max-w-[480px] px-4 py-8 sm:py-12">
      {producer ? (
        <Link
          to={`/profile/${encodeURIComponent(producer.alias)}`}
          className="flex items-center gap-3 border border-line bg-panel px-4 py-3 transition-colors hover:border-line-bright"
        >
          <Avatar alias={producer.alias} src={producer.avatar} size={40} />
          <span className="flex items-center gap-1.5 font-mono text-[13px] text-ink">
            @{producer.alias}
            {producer.verified ? <VerifiedBadge size={13} /> : null}
          </span>
          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            {nl ? 'Waveform-clip' : 'Waveform clip'}
          </span>
        </Link>
      ) : null}

      {video.tag ? (
        <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">{video.tag}</div>
      ) : null}

      <video
        src={mediaUrl(video.url)}
        poster={video.poster ? mediaUrl(video.poster) : undefined}
        controls
        autoPlay
        loop
        playsInline
        className="mt-4 block aspect-[9/16] w-full border border-line bg-black"
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <Btn onClick={shareClip} variant="solid" disabled={busy}>
          {busy ? (nl ? 'Even…' : 'One sec…') : nl ? 'Delen' : 'Share'}
        </Btn>
        <Btn onClick={downloadClip} variant="ghost" disabled={busy}>
          {nl ? 'Download' : 'Download'}
        </Btn>
        {video.battleId ? (
          <Btn to={`/battles/${video.battleId}`} variant="ghost">
            {nl ? 'Bekijk battle' : 'View battle'}
          </Btn>
        ) : null}
        {producer ? (
          <Btn to={`/profile/${encodeURIComponent(producer.alias)}`} variant="ghost">
            {nl ? 'Bekijk profiel' : 'View profile'}
          </Btn>
        ) : null}
      </div>
    </div>
  )
}
