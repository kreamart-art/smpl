import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/index.jsx'

// Plain-language "how SMPL works" / FAQ page, bilingual (NL/EN).
const CONTENT = {
  en: {
    title: 'How SMPL works',
    intro:
      'SMPL is a beat & verse battle platform. A curator drops one source (a sample to flip or a beat to rhyme over) and producers and artists each put their own spin on it. The crowd votes, and the best take wins.',
    sections: [
      {
        h: 'The idea',
        b: 'Everyone works from the same source, so it’s purely about interpretation. One sample, many takes. Same sample, different soul. The room decides the winner by voting.',
      },
      {
        h: 'The roles',
        b: 'Listener: follow makers, vote and comment. Producer: enter beat battles (flip the sample). Artist: enter verse battles (rhyme over the beat). Curator: runs battles and picks the source. You can be both a producer and an artist (turn it on in Settings → Account type).',
      },
      {
        h: 'A battle’s phases',
        b: '1) Announced: a battle appears. 2) Open for signup: claim a slot. 3) Submission: upload your beat or verse. 4) Voting: the crowd picks its favourite. 5) Winner: the result is crowned.',
      },
      {
        h: 'How do I enter a battle?',
        b: 'Open a battle that’s “open for signup”, accept the battle rules, and claim a slot (slots are limited). When the submission phase opens, upload your entry. Breaking the rules means disqualification.',
      },
      {
        h: 'How does voting work?',
        b: 'Anyone (listeners, producers and artists) can vote on any battle. The only exception: producers and artists can’t vote in a battle they’re competing in. One vote per battle, and never for your own entry.',
      },
      {
        h: 'Blind / anonymous voting',
        b: 'Some battles hide the makers’ names while voting is open, so you judge the music and not the name. Names are revealed once the winner is declared.',
      },
      {
        h: 'Can a curator also compete?',
        b: 'Yes, a curator can switch it on in Settings → “Compete in battles”. The one hard rule: you can never enter a battle you curate yourself.',
      },
      {
        h: 'Following, messages & sharing',
        b: 'Follow anyone, including listeners. You can message people, reply to and react on messages, send photos and voice clips, and share a profile or battle straight into a DM.',
      },
      {
        h: 'The verified badge',
        b: 'A red check next to a name means the account is verified by SMPL.',
      },
      {
        h: 'Your account',
        b: 'Change your handle or login email under Settings → “Handle & email” (a new email gets a quick verification). Install SMPL to your home screen via Settings → “Install app”.',
      },
      {
        h: 'Report, block or contact us',
        b: 'Use the ⋯ menu on a profile or entry to report or block. For anything else, reach us via the Contact page.',
      },
    ],
    more: 'More',
  },
  nl: {
    title: 'Hoe SMPL werkt',
    intro:
      'SMPL is een beat- & verse-battleplatform. Een curator levert één bron (een sample om te flippen of een beat om overheen te rappen) en producers en artiesten geven er allemaal hun eigen draai aan. De crowd stemt, en de beste versie wint.',
    sections: [
      {
        h: 'Het idee',
        b: 'Iedereen werkt vanuit dezelfde bron, dus het draait puur om interpretatie. Eén sample, veel versies. Same sample, different soul. De zaal bepaalt de winnaar door te stemmen.',
      },
      {
        h: 'De rollen',
        b: 'Luisteraar: volg makers, stem en reageer. Producer: doe mee aan beat-battles (flip de sample). Artiest: doe mee aan verse-battles (rap over de beat). Curator: organiseert battles en kiest de bron. Je kunt zowel producer als artiest zijn (zet aan bij Instellingen → Accounttype).',
      },
      {
        h: 'De fases van een battle',
        b: '1) Aangekondigd: een battle verschijnt. 2) Open voor inschrijving: claim een plek. 3) Inzenden: upload je beat of verse. 4) Stemmen: de crowd kiest z’n favoriet. 5) Winnaar: het resultaat wordt gekroond.',
      },
      {
        h: 'Hoe doe ik mee aan een battle?',
        b: 'Open een battle die “open voor inschrijving” staat, ga akkoord met de battle-regels, en claim een plek (plekken zijn beperkt). Zodra de inzendfase opent, upload je je inzending. Regels overtreden betekent diskwalificatie.',
      },
      {
        h: 'Hoe werkt stemmen?',
        b: 'Iedereen (luisteraars, producers én artiesten) kan op elke battle stemmen. De enige uitzondering: producers en artiesten kunnen niet stemmen in een battle waar ze zelf aan meedoen. Eén stem per battle, en nooit op je eigen inzending.',
      },
      {
        h: 'Blind / anoniem stemmen',
        b: 'Bij sommige battles zijn de namen van de makers verborgen tijdens het stemmen, zodat je de muziek beoordeelt en niet de naam. Namen worden onthuld zodra de winnaar bekend is.',
      },
      {
        h: 'Mag een curator ook meedoen?',
        b: 'Ja, een curator kan dit aanzetten bij Instellingen → “Meedoen aan battles”. De enige harde regel: je mag nooit meedoen aan een battle die jij zelf cureert.',
      },
      {
        h: 'Volgen, berichten & delen',
        b: 'Volg iedereen, ook luisteraars. Je kunt mensen berichten, reageren op berichten, foto’s en spraakclips sturen, en een profiel of battle direct in een DM delen.',
      },
      {
        h: 'De geverifieerd-badge',
        b: 'Een rood vinkje naast een naam betekent dat het account door SMPL is geverifieerd.',
      },
      {
        h: 'Je account',
        b: 'Wijzig je handle of login-e-mail bij Instellingen → “Handle & e-mail” (een nieuw adres krijgt een korte bevestiging). Zet SMPL op je beginscherm via Instellingen → “App installeren”.',
      },
      {
        h: 'Rapporteren, blokkeren of contact',
        b: 'Gebruik het ⋯-menu op een profiel of inzending om te rapporteren of blokkeren. Voor al het andere bereik je ons via de Contact-pagina.',
      },
    ],
    more: 'Meer',
  },
}

export default function Help() {
  const { lang } = useI18n()
  const data = CONTENT[lang] || CONTENT.en

  return (
    <div className="mx-auto max-w-[760px] px-4 py-14 sm:px-6 sm:py-20">
      <div className="border-b border-line pb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">SMPL · HELP</div>
        <h1 className="mt-3 font-sans text-[clamp(2.2rem,7vw,4rem)] font-bold uppercase leading-none tracking-tighter">
          {data.title}
        </h1>
        <p className="mt-5 max-w-2xl font-sans text-[15px] leading-relaxed text-ink-dim">{data.intro}</p>
      </div>

      <div className="mt-10 flex flex-col">
        {data.sections.map((s, i) => (
          <section key={i} className="border-b border-line py-6">
            <div className="flex gap-4">
              <span className="font-mono text-[12px] text-faint tnum">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h2 className="font-sans text-lg font-bold uppercase tracking-tight text-ink">{s.h}</h2>
                <p className="mt-2 font-sans text-[14px] leading-relaxed text-ink-dim">{s.b}</p>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        <Link to="/contact" className="hover:text-ink">{lang === 'nl' ? 'Contact' : 'Contact'}</Link>
        <Link to="/guidelines" className="hover:text-ink">{lang === 'nl' ? 'Communityregels' : 'Guidelines'}</Link>
        <Link to="/terms" className="hover:text-ink">{lang === 'nl' ? 'Voorwaarden' : 'Terms'}</Link>
        <Link to="/privacy" className="hover:text-ink">Privacy</Link>
      </div>
    </div>
  )
}
