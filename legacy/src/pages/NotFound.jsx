import { Btn } from '../components/ui.jsx'
import Waveform from '../components/Waveform.jsx'
import { useT } from '../i18n/index.jsx'

export default function NotFound() {
  const t = useT()
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-24 sm:px-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{t('notFound.kicker')}</div>
      <h1 className="mt-3 font-sans text-[clamp(3rem,12vw,9rem)] font-bold uppercase leading-[0.8] tracking-tighter">
        {t('notFound.title')}
      </h1>
      <p className="mt-4 font-mono text-[12px] text-muted">{t('notFound.body')}</p>
      <div className="mt-8 max-w-md">
        <Waveform seed="404-dead" bars={80} height={40} baseClass="bg-line" playedClass="bg-line" />
      </div>
      <div className="mt-8 flex gap-3">
        <Btn to="/" variant="solid">{t('notFound.home')}</Btn>
        <Btn to="/battles" variant="ghost">{t('common.battles')}</Btn>
      </div>
    </div>
  )
}
