import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useT } from '../i18n/index.jsx'
import { Btn, Field, inputCls, textareaCls } from '../components/ui.jsx'

const CONTACT_EMAIL = 'info@artnomad.nl'
const TOPICS = ['collab', 'bug', 'other']

export default function Contact() {
  const { sendContact, mailConfigured } = useApp()
  const t = useT()
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('collab')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const r = await sendContact(email.trim(), message.trim(), t(`contact.topic.${topic}`))
    setBusy(false)
    if (r.ok) setSent(true)
    else setError(r.error || 'Failed.')
  }

  return (
    <div className="mx-auto max-w-[640px] px-4 py-12 sm:px-6 sm:py-16">
      <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-faint">SMPL · {t('contact.title')}</div>
      <h1 className="mt-3 font-sans text-[clamp(2.2rem,7vw,3.6rem)] font-bold uppercase leading-[0.9] tracking-tighter">
        {t('contact.title')}
      </h1>
      <p className="mt-6 max-w-prose font-sans text-[15px] leading-relaxed text-muted">{t('contact.intro')}</p>

      {sent ? (
        <div className="mt-10 border border-line-bright bg-panel p-6 font-mono text-[13px] leading-relaxed text-ink">
          {t('contact.sent')}
        </div>
      ) : mailConfigured ? (
        <form onSubmit={submit} className="mt-10 space-y-5">
          <Field label={t('contact.email')}>
            <input
              type="email"
              className={inputCls}
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label={t('contact.topic')}>
            <div className="grid grid-cols-3 gap-2">
              {TOPICS.map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setTopic(k)}
                  className={`border px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                    topic === k ? 'border-ink bg-ink text-bg' : 'border-line text-ink hover:border-ink'
                  }`}
                >
                  {t(`contact.topic.${k}`)}
                </button>
              ))}
            </div>
          </Field>
          <Field label={t('contact.message')}>
            <textarea
              className={textareaCls}
              rows={5}
              placeholder={t('contact.placeholderMessage')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
            />
          </Field>
          {error ? (
            <div className="border border-line-bright px-3 py-2 font-mono text-[11px] text-ink">! {error}</div>
          ) : null}
          <Btn type="submit" variant="solid" size="lg" disabled={busy || !email.trim() || message.trim().length < 5}>
            {busy ? t('contact.sending') : t('contact.send')}
          </Btn>
        </form>
      ) : null}

      <div className="mt-10 border-t border-line pt-6 font-mono text-[12px] leading-relaxed text-muted">
        {t('contact.direct')}{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-ink underline underline-offset-4">
          {CONTACT_EMAIL}
        </a>
      </div>
    </div>
  )
}
