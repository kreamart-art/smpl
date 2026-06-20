import { useState } from 'react'
import Portal from './Portal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { Btn, Field, inputCls, textareaCls } from './ui.jsx'

const pad = (n) => String(n).padStart(2, '0')
const toLocal = (ms) => {
  if (!ms) return ''
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Curator edits a battle they made — title, source credits, slots, options and
// (for scheduled battles) the actual dates.
export default function EditBattleModal({ battle, onClose, onSaved, onDeleted }) {
  const t = useT()
  const { updateBattle, deleteBattle } = useApp()
  const [form, setForm] = useState({
    title: battle.title || '',
    sampleArtist: battle.sampleArtist || '',
    sampleSong: battle.sampleSong || '',
    description: battle.description || '',
    genre: battle.genre || '',
    maxProducers: battle.maxProducers || 8,
    sampleRevealed: !!battle.sampleRevealed,
    blind: !!battle.blind,
    tieBreak: battle.tieBreak === 'curator' ? 'curator' : 'earliest',
    scheduled: !!battle.scheduled,
    signupStart: toLocal(battle.signupStart),
    submissionsOpen: toLocal(battle.signupEnd),
    votingOpens: toLocal(battle.submitEnd),
    votingCloses: toLocal(battle.voteEnd),
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setErr('')
    const payload = {
      title: form.title,
      sampleArtist: form.sampleArtist,
      sampleSong: form.sampleSong,
      description: form.description,
      genre: form.genre,
      maxProducers: form.maxProducers,
      sampleRevealed: form.sampleRevealed,
      blind: form.blind,
      tieBreak: form.tieBreak,
      scheduled: form.scheduled,
    }
    if (form.scheduled) {
      const ms = (v) => (v ? new Date(v).getTime() : NaN)
      payload.signupStart = ms(form.signupStart)
      payload.submissionsOpen = ms(form.submissionsOpen)
      payload.votingOpens = ms(form.votingOpens)
      payload.votingCloses = ms(form.votingCloses)
      if ([payload.signupStart, payload.submissionsOpen, payload.votingOpens, payload.votingCloses].some((x) => !Number.isFinite(x))) {
        setErr(t('dashboard.schedule.fillAll'))
        return
      }
    }
    setBusy(true)
    const r = await updateBattle(battle.id, payload)
    setBusy(false)
    if (r.ok) onSaved()
    else setErr(r.error || t('profile.saveError'))
  }

  const [confirmDel, setConfirmDel] = useState(false)
  const del = async () => {
    setErr('')
    setBusy(true)
    const r = await deleteBattle(battle.id)
    setBusy(false)
    if (r.ok) (onDeleted || onClose)()
    else setErr(r.error || t('profile.saveError'))
  }

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4"
        onClick={onClose}
      >
        <div
          className="flex max-h-[90vh] w-full max-w-[560px] flex-col border border-line-bright bg-panel"
          onClick={(e) => e.stopPropagation()}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink">{t('dashboard.manage.edit')}</span>
            <button onClick={onClose} className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">
              {t('common.close')} ✕
            </button>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <Field label={t('dashboard.create.fieldTitle')}>
              <input className={inputCls} value={form.title} onChange={(e) => upd('title', e.target.value)} />
            </Field>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label={battle.kind === 'VERSES' ? t('dashboard.create.beatBy') : t('dashboard.create.sampleArtist')}>
                <input className={inputCls} value={form.sampleArtist} onChange={(e) => upd('sampleArtist', e.target.value)} />
              </Field>
              <Field label={battle.kind === 'VERSES' ? t('dashboard.create.beatTitle') : t('dashboard.create.sampleTrack')}>
                <input className={inputCls} value={form.sampleSong} onChange={(e) => upd('sampleSong', e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label={t('dashboard.create.maxProducers')}>
                <input
                  type="number"
                  min={2}
                  max={64}
                  className={inputCls}
                  value={form.maxProducers}
                  onChange={(e) => upd('maxProducers', e.target.value)}
                />
              </Field>
              <Field label={t('host.genre')}>
                <input className={inputCls} value={form.genre} onChange={(e) => upd('genre', e.target.value)} />
              </Field>
            </div>
            <Field label={t('dashboard.create.description')}>
              <textarea rows={3} className={textareaCls} value={form.description} onChange={(e) => upd('description', e.target.value)} />
            </Field>
            <label className="flex items-center gap-3 font-mono text-[11px] text-ink">
              <input type="checkbox" checked={form.sampleRevealed} onChange={(e) => upd('sampleRevealed', e.target.checked)} className="h-4 w-4 accent-white" />
              {t('dashboard.create.revealNow')}
            </label>
            <label className="flex items-center gap-3 font-mono text-[11px] text-ink">
              <input type="checkbox" checked={form.blind} onChange={(e) => upd('blind', e.target.checked)} className="h-4 w-4 accent-white" />
              {t('dashboard.create.blind')}
            </label>

            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{t('dashboard.create.tieBreak')}</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {['earliest', 'curator'].map((tb) => (
                  <button
                    key={tb}
                    type="button"
                    onClick={() => upd('tieBreak', tb)}
                    className={`border px-3 py-2 text-left font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                      form.tieBreak === tb
                        ? 'border-ink bg-ink text-bg'
                        : 'border-line text-muted hover:border-line-bright hover:text-ink'
                    }`}
                  >
                    {t(`dashboard.create.tieBreak.${tb}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-line pt-4">
              <label className="flex items-center gap-3 font-mono text-[11px] text-ink">
                <input type="checkbox" checked={form.scheduled} onChange={(e) => upd('scheduled', e.target.checked)} className="h-4 w-4 accent-white" />
                {t('dashboard.create.scheduled')}
              </label>
              {form.scheduled ? (
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    ['signupStart', 'dashboard.schedule.signupOpens'],
                    ['submissionsOpen', 'dashboard.schedule.submissionsOpen'],
                    ['votingOpens', 'dashboard.schedule.votingOpens'],
                    ['votingCloses', 'dashboard.schedule.votingCloses'],
                  ].map(([key, label]) => (
                    <Field key={key} label={t(label)}>
                      <input type="datetime-local" className={inputCls} value={form[key]} onChange={(e) => upd(key, e.target.value)} />
                    </Field>
                  ))}
                </div>
              ) : (
                <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted">{t('dashboard.create.manualHint')}</p>
              )}
            </div>

            <div className="border-t border-line pt-4">
              {!confirmDel ? (
                <button
                  type="button"
                  onClick={() => setConfirmDel(true)}
                  className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
                >
                  {t('dashboard.manage.delete')}
                </button>
              ) : (
                <div className="space-y-3 border border-line-bright p-4">
                  <p className="font-mono text-[11px] leading-relaxed text-ink">{t('dashboard.manage.deleteConfirm')}</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={del}
                      disabled={busy}
                      className="border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-bg transition-colors hover:bg-bright disabled:opacity-50"
                    >
                      {busy ? '…' : t('dashboard.manage.deleteYes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDel(false)}
                      className="border border-line-bright px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-bg"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {err ? <p className="font-mono text-[11px] text-ink">! {err}</p> : null}
          </div>
          <div className="flex gap-3 border-t border-line p-5">
            <Btn onClick={save} variant="solid" disabled={busy} full>
              {busy ? t('profile.saving') : t('common.save')}
            </Btn>
            <Btn onClick={onClose} variant="ghost">
              {t('common.cancel')}
            </Btn>
          </div>
        </div>
      </div>
    </Portal>
  )
}
