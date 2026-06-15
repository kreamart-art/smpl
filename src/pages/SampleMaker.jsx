import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { useI18n } from '../i18n/index.jsx'
import { Btn, Field, inputCls } from '../components/ui.jsx'

const COPY = {
  en: {
    eyebrow: 'SMPL · SAMPLE MAKER',
    title: 'Become a sample maker',
    intro:
      'Make the source other artists battle over. Submit your loops and samples; approved ones go into the curator library and can be dropped into battles, with your name on them.',
    how: 'How you get paid',
    howBody:
      'Your sample is free to use inside battles. If a producer wants to release the resulting beat commercially, they buy a licence for your sample, and you earn 80% of every licence (SMPL keeps 20%). Payouts go live once our payment rails are set up; for now you’re reserving your spot and your terms.',
    pickModel: 'Your payout model',
    models: {
      license: { h: 'Commercial licence', b: 'A clean fee each time a producer licences your sample to release commercially.' },
      royalty: { h: 'Royalty split', b: 'A share of the song’s royalties over time (set up later, once distributors are connected).' },
      both: { h: 'Both: let the producer choose', b: 'Offer either; the producer picks which when they commercialise.' },
    },
    rights: 'I confirm I fully own these samples (no uncleared third-party material) and accept the 80/20 split and sample-maker terms.',
    apply: 'Apply',
    applying: 'Applying…',
    pendingH: 'Application received',
    pendingB: 'Your application is under review. We’ll let you know, then you can start submitting samples.',
    rejectedH: 'Not approved (yet)',
    rejectedB: 'Your application wasn’t approved this time. You can adjust and apply again.',
    reapply: 'Apply again',
    approvedH: 'You’re a sample maker',
    submitH: 'Submit a sample',
    name: 'Sample name',
    genre: 'Genre',
    bpm: 'BPM',
    key: 'Key',
    audio: 'Sample audio',
    upload: 'Upload audio',
    uploaded: 'Audio added',
    submit: 'Submit for review',
    submitting: 'Submitting…',
    mine: 'Your submissions',
    none: 'No submissions yet.',
    status: { pending: 'In review', approved: 'In library', rejected: 'Not approved' },
    needAudio: 'Upload the sample audio first.',
    needName: 'Add a name and a genre.',
    submitted: 'Submitted. We’ll review it shortly.',
    back: 'Back',
  },
  nl: {
    eyebrow: 'SMPL · SAMPLE MAKER',
    title: 'Word sample maker',
    intro:
      'Maak de bron waar andere artiesten overheen battlen. Stuur je loops en samples in; goedgekeurde komen in de curator-bibliotheek en kunnen in battles gebruikt worden, met jouw naam erbij.',
    how: 'Hoe je betaald wordt',
    howBody:
      'Je sample is gratis te gebruiken in battles. Wil een producer de gemaakte beat commercieel uitbrengen, dan koopt hij een licentie voor jouw sample, en jij verdient 80% van elke licentie (SMPL houdt 20%). Uitbetalingen gaan live zodra onze betaalrails klaar zijn; voor nu reserveer je je plek en je voorwaarden.',
    pickModel: 'Jouw verdienmodel',
    models: {
      license: { h: 'Commerciële licentie', b: 'Een vaste vergoeding telkens als een producer je sample licentieert om commercieel uit te brengen.' },
      royalty: { h: 'Royalty-split', b: 'Een aandeel in de royalties van de song over tijd (later, zodra distributeurs gekoppeld zijn).' },
      both: { h: 'Beide: laat de producer kiezen', b: 'Bied allebei aan; de producer kiest welke bij commercieel gebruik.' },
    },
    rights: 'Ik bevestig dat ik deze samples volledig zelf bezit (geen ongeclearde derden) en ga akkoord met de 80/20-verdeling en de sample-maker-voorwaarden.',
    apply: 'Aanmelden',
    applying: 'Bezig…',
    pendingH: 'Aanmelding ontvangen',
    pendingB: 'Je aanmelding wordt beoordeeld. We laten het weten, dan kun je samples insturen.',
    rejectedH: 'Nog niet goedgekeurd',
    rejectedB: 'Je aanmelding is deze keer niet goedgekeurd. Je kunt aanpassen en opnieuw aanmelden.',
    reapply: 'Opnieuw aanmelden',
    approvedH: 'Je bent sample maker',
    submitH: 'Sample insturen',
    name: 'Samplenaam',
    genre: 'Genre',
    bpm: 'BPM',
    key: 'Toonsoort',
    audio: 'Sample-audio',
    upload: 'Audio uploaden',
    uploaded: 'Audio toegevoegd',
    submit: 'Insturen voor review',
    submitting: 'Bezig…',
    mine: 'Jouw inzendingen',
    none: 'Nog geen inzendingen.',
    status: { pending: 'In review', approved: 'In bibliotheek', rejected: 'Afgewezen' },
    needAudio: 'Upload eerst de sample-audio.',
    needName: 'Voeg een naam en een genre toe.',
    submitted: 'Ingestuurd. We beoordelen het snel.',
    back: 'Terug',
  },
}

function ApplyForm({ c, onApply }) {
  const [model, setModel] = useState('license')
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const go = async () => {
    if (!agree) return setErr(c.rights)
    setBusy(true)
    setErr('')
    const r = await onApply(model, agree)
    setBusy(false)
    if (!r?.ok) setErr(r?.error || 'Failed')
  }
  return (
    <div className="border border-line-bright bg-panel p-5">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink">{c.pickModel}</div>
      <div className="mt-3 flex flex-col gap-px border border-line">
        {['license', 'royalty', 'both'].map((m) => (
          <button
            key={m}
            onClick={() => setModel(m)}
            className={`flex items-start gap-3 px-4 py-3 text-left transition-colors ${model === m ? 'bg-ink text-bg' : 'text-ink hover:bg-bg'}`}
          >
            <span className={`mt-0.5 block h-3 w-3 shrink-0 border ${model === m ? 'border-bg bg-bg' : 'border-line-bright'}`} />
            <span>
              <span className="block font-mono text-[12px] uppercase tracking-[0.1em]">{c.models[m].h}</span>
              <span className={`mt-1 block font-mono text-[11px] leading-relaxed ${model === m ? 'text-bg/80' : 'text-muted'}`}>
                {c.models[m].b}
              </span>
            </span>
          </button>
        ))}
      </div>
      <label className="mt-4 flex items-start gap-3 font-mono text-[11px] leading-relaxed text-ink-dim">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-white" />
        <span>{c.rights}</span>
      </label>
      {err ? <p className="mt-3 font-mono text-[11px] text-ink">! {err}</p> : null}
      <div className="mt-4">
        <Btn onClick={go} variant="solid" disabled={busy || !agree}>
          {busy ? c.applying : c.apply}
        </Btn>
      </div>
    </div>
  )
}

function SubmitForm({ c, onUpload, onSubmit }) {
  const [form, setForm] = useState({ name: '', genre: '', bpm: '', key: '', url: '', fileName: '' })
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    const r = await onUpload(file)
    setUploading(false)
    if (r.ok && r.url) setForm((f) => ({ ...f, url: r.url, fileName: file.name }))
    else setErr(r.error || 'Upload failed')
  }
  const go = async () => {
    setErr('')
    setOk('')
    if (!form.name.trim() || !form.genre.trim()) return setErr(c.needName)
    if (!form.url) return setErr(c.needAudio)
    setBusy(true)
    const r = await onSubmit({ name: form.name.trim(), genre: form.genre.trim(), bpm: form.bpm, key: form.key, url: form.url })
    setBusy(false)
    if (r.ok) {
      setOk(c.submitted)
      setForm({ name: '', genre: '', bpm: '', key: '', url: '', fileName: '' })
    } else setErr(r.error || 'Failed')
  }

  return (
    <div className="border border-line-bright bg-panel p-5">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink">{c.submitH}</div>
      <div className="mt-4 space-y-4">
        <Field label={c.name}>
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label={c.genre}>
            <input className={inputCls} placeholder="Boom Bap · R&B" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
          </Field>
          <Field label={c.bpm}>
            <input className={inputCls} type="number" value={form.bpm} onChange={(e) => setForm({ ...form, bpm: e.target.value })} />
          </Field>
          <Field label={c.key}>
            <input className={inputCls} placeholder="A min" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
          </Field>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">{c.audio}</div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className={`cursor-pointer border border-line-bright px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-bg ${uploading ? 'pointer-events-none opacity-40' : ''}`}>
              {uploading ? '…' : form.url ? c.uploaded : c.upload}
              <input type="file" accept="audio/*" className="hidden" onChange={pick} disabled={uploading} />
            </label>
            {form.fileName ? <span className="max-w-[180px] truncate font-mono text-[11px] text-muted">✓ {form.fileName}</span> : null}
          </div>
        </div>
        {err ? <p className="font-mono text-[11px] text-ink">! {err}</p> : null}
        {ok ? <p className="font-mono text-[11px] text-muted">✓ {ok}</p> : null}
        <Btn onClick={go} variant="solid" disabled={busy}>
          {busy ? c.submitting : c.submit}
        </Btn>
      </div>
    </div>
  )
}

export default function SampleMaker() {
  const { currentUser, applySampleMaker, submitSample, uploadAudio, fetchMySamples } = useApp()
  const { lang } = useI18n()
  const navigate = useNavigate()
  const c = COPY[lang] || COPY.en
  const [mine, setMine] = useState([])
  const status = currentUser?.sampleMakerStatus || null

  const reload = () => fetchMySamples().then((r) => r.ok && setMine(r.samples || []))
  useEffect(() => {
    if (status === 'approved') reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  if (!currentUser) return <Navigate to="/login" replace />

  return (
    <div className="mx-auto max-w-[680px] px-4 py-12 sm:px-6 sm:py-16">
      <button onClick={() => navigate(-1)} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
        ◂ {c.back}
      </button>
      <div className="mt-5 border-b border-line pb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">{c.eyebrow}</div>
        <h1 className="mt-3 font-sans text-[clamp(2.2rem,7vw,3.6rem)] font-bold uppercase leading-none tracking-tighter">{c.title}</h1>
        <p className="mt-5 font-sans text-[15px] leading-relaxed text-ink-dim">{c.intro}</p>
      </div>

      <div className="mt-6 border border-line bg-panel p-5">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink">{c.how}</div>
        <p className="mt-2 font-mono text-[12px] leading-relaxed text-muted">{c.howBody}</p>
      </div>

      <div className="mt-6">
        {status === 'pending' ? (
          <div className="border border-line-bright bg-panel p-6">
            <div className="font-sans text-lg font-bold uppercase tracking-tight text-ink">{c.pendingH}</div>
            <p className="mt-2 font-mono text-[12px] leading-relaxed text-muted">{c.pendingB}</p>
          </div>
        ) : status === 'approved' ? (
          <div className="space-y-6">
            <div className="border border-line-bright bg-panel px-5 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink">
              ✓ {c.approvedH}
            </div>
            <SubmitForm c={c} onUpload={uploadAudio} onSubmit={async (p) => { const r = await submitSample(p); if (r.ok) reload(); return r }} />
            <div>
              <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">{c.mine}</div>
              {!mine.length ? (
                <p className="font-mono text-[12px] text-muted">{c.none}</p>
              ) : (
                <div className="border border-line">
                  {mine.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-mono text-[12px] text-ink">{s.name}</div>
                        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                          {s.genre}{s.bpm ? ` · ${s.bpm} BPM` : ''}{s.key ? ` · ${s.key}` : ''}
                        </div>
                      </div>
                      <span className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] ${s.status === 'approved' ? 'text-ink' : s.status === 'rejected' ? 'text-faint' : 'text-muted'}`}>
                        {c.status[s.status] || s.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : status === 'rejected' ? (
          <div className="space-y-5">
            <div className="border border-line-bright bg-panel p-6">
              <div className="font-sans text-lg font-bold uppercase tracking-tight text-ink">{c.rejectedH}</div>
              <p className="mt-2 font-mono text-[12px] leading-relaxed text-muted">{c.rejectedB}</p>
            </div>
            <ApplyForm c={c} onApply={applySampleMaker} />
          </div>
        ) : (
          <ApplyForm c={c} onApply={applySampleMaker} />
        )}
      </div>
    </div>
  )
}
