import { Link } from 'react-router-dom'
import { useI18n, useT } from '../i18n/index.jsx'

// Plain-language Privacy Policy + Terms of Service for SMPL, bilingual (NL/EN),
// rendered from the structured content below. Edit CONTACT / OPERATOR to match
// the real legal entity + inbox.
const CONTACT = 'info@artnomad.nl'
const OPERATOR = 'ART NOMAD'
const UPDATED = '2026-06-12'

const CONTENT = {
  privacy: {
    nl: {
      title: 'Privacybeleid',
      intro: `Dit beleid legt in gewone taal uit welke persoonsgegevens SMPL verzamelt, waarom, en welke rechten je hebt. SMPL is een platform voor beat- en verse-battles, beheerd door ${OPERATOR}.`,
      sections: [
        {
          h: 'Wie wij zijn',
          p: [`SMPL wordt beheerd door ${OPERATOR}. Voor vragen over je privacy of dit beleid bereik je ons op ${CONTACT}.`],
        },
        {
          h: 'Welke gegevens we verzamelen',
          p: [
            'Account: je alias, e-mailadres en een versleuteld (gehasht) wachtwoord.',
            'Identiteit: je volledige naam en geboortedatum — we gebruiken de geboortedatum om te bevestigen dat je oud genoeg bent. Deze velden zijn privé en alleen voor jou zichtbaar.',
            'Profiel: bio, locatie, genres, links, profielfoto en een optioneel openbaar contact-e-mailadres dat je zelf kiest.',
            'Jouw content: audio-inzendingen, stemmen, berichten en wie je volgt.',
            'Technische gegevens: je IP-adres en serverlogs, kort bewaard voor beveiliging en anti-spam.',
          ],
        },
        {
          h: 'Waarom we ze gebruiken',
          p: [
            'Om je account en de dienst te leveren (uitvoering van de overeenkomst met jou).',
            'Voor beveiliging en het voorkomen van fraude en spam (ons gerechtvaardigd belang).',
            'Optionele velden, zoals je openbare contact-e-mail, gebruiken we alleen met jouw toestemming — je kunt ze altijd weghalen.',
          ],
        },
        {
          h: 'Cookies en opslag',
          p: [
            'We gebruiken geen trackingcookies en geen advertentie- of analysetrackers. We bewaren lokaal in je browser alleen wat nodig is om je ingelogd te houden en je voorkeuren (taal, weergave) te onthouden.',
          ],
        },
        {
          h: 'Delen met anderen',
          p: [
            'We verkopen je gegevens nooit. We delen ze alleen met de partijen die nodig zijn om de dienst te laten werken: onze hostingprovider (servers in een datacenter in de EU) en onze e-mailprovider voor systeemmails zoals wachtwoordherstel.',
          ],
        },
        {
          h: 'Hoe lang we ze bewaren',
          p: [
            'We bewaren je gegevens zolang je een account hebt. Verwijder je je account, dan verwijderen we je persoonsgegevens — behalve wat we wettelijk moeten bewaren of kort nodig hebben om misbruik te voorkomen.',
          ],
        },
        {
          h: 'Jouw rechten',
          p: [
            'Je hebt recht op inzage, correctie, verwijdering, beperking, bezwaar en overdraagbaarheid van je gegevens. Veel hiervan regel je zelf: je gegevens staan in je profiel en je kunt je account volledig verwijderen in de instellingen.',
            `Vragen of klachten kun je sturen naar ${CONTACT}. Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).`,
          ],
        },
        {
          h: 'Beveiliging',
          p: [
            'Wachtwoorden worden gehasht opgeslagen, we bieden tweestapsverificatie (2FA) aan en alle verbindingen verlopen versleuteld via HTTPS.',
          ],
        },
        {
          h: 'Minderjarigen',
          p: ['SMPL is bedoeld voor gebruikers van 16 jaar en ouder.'],
        },
        {
          h: 'Wijzigingen',
          p: ['We kunnen dit beleid bijwerken. De datum bovenaan toont wanneer het voor het laatst is gewijzigd.'],
        },
      ],
    },
    en: {
      title: 'Privacy Policy',
      intro: `This policy explains in plain language what personal data SMPL collects, why, and what rights you have. SMPL is a beat- and verse-battle platform operated by ${OPERATOR}.`,
      sections: [
        {
          h: 'Who we are',
          p: [`SMPL is operated by ${OPERATOR}. For any question about your privacy or this policy, reach us at ${CONTACT}.`],
        },
        {
          h: 'What we collect',
          p: [
            'Account: your alias, email address and an encrypted (hashed) password.',
            'Identity: your legal name and date of birth — we use the date of birth to confirm you are old enough. These fields are private and visible only to you.',
            'Profile: bio, location, genres, links, profile photo and an optional public contact email you choose yourself.',
            'Your content: audio submissions, votes, messages and who you follow.',
            'Technical data: your IP address and server logs, kept briefly for security and anti-spam.',
          ],
        },
        {
          h: 'Why we use it',
          p: [
            'To provide your account and the service (performing our agreement with you).',
            'For security and to prevent fraud and spam (our legitimate interest).',
            'Optional fields, such as your public contact email, are used only with your consent — you can remove them at any time.',
          ],
        },
        {
          h: 'Cookies and storage',
          p: [
            'We use no tracking cookies and no advertising or analytics trackers. We store locally in your browser only what is needed to keep you signed in and remember your preferences (language, display).',
          ],
        },
        {
          h: 'Sharing',
          p: [
            'We never sell your data. We share it only with the parties needed to run the service: our hosting provider (servers in an EU data centre) and our email provider for system emails such as password resets.',
          ],
        },
        {
          h: 'How long we keep it',
          p: [
            'We keep your data while you have an account. If you delete your account, we delete your personal data — except what we are legally required to keep or briefly need to prevent abuse.',
          ],
        },
        {
          h: 'Your rights',
          p: [
            'You have the right to access, correct, delete, restrict, object to and port your data. Much of this you control yourself: your data lives in your profile and you can delete your account entirely in settings.',
            `For questions or complaints, email ${CONTACT}. If you are in the EU you may also lodge a complaint with your local data protection authority (in the Netherlands: autoriteitpersoonsgegevens.nl).`,
          ],
        },
        {
          h: 'Security',
          p: [
            'Passwords are stored hashed, we offer two-factor authentication (2FA), and all connections run encrypted over HTTPS.',
          ],
        },
        {
          h: 'Minors',
          p: ['SMPL is intended for users aged 16 and over.'],
        },
        {
          h: 'Changes',
          p: ['We may update this policy. The date at the top shows when it was last changed.'],
        },
      ],
    },
  },
  terms: {
    nl: {
      title: 'Gebruiksvoorwaarden',
      intro: 'Deze voorwaarden gelden voor iedereen die SMPL gebruikt. Lees ze even door — door SMPL te gebruiken ga je ermee akkoord.',
      sections: [
        {
          h: 'Akkoord',
          p: ['Door een account aan te maken of SMPL te gebruiken ga je akkoord met deze voorwaarden en met ons Privacybeleid.'],
        },
        {
          h: 'Je account',
          p: [
            'Je moet minimaal 16 jaar zijn en juiste gegevens opgeven.',
            'Je bent verantwoordelijk voor je account en voor het geheimhouden van je wachtwoord. Zet tweestapsverificatie aan voor extra beveiliging.',
          ],
        },
        {
          h: 'Wat SMPL is',
          p: [
            'SMPL is een platform waarop makers dezelfde sample of open verse krijgen en daar hun eigen versie van maken. De community luistert mee en stemt. Zelfde sample, andere ziel.',
          ],
        },
        {
          h: 'Jouw content en rechten',
          p: [
            'Je behoudt alle rechten op wat je uploadt. Je geeft SMPL alleen een niet-exclusieve licentie om je inzending op het platform op te slaan, af te spelen en te tonen, zodat de battle en het stemmen kunnen werken.',
            'Je garandeert dat je de rechten hebt op alles wat je uploadt — inclusief samples en opnames — of dat jouw gebruik is toegestaan. Plaats geen materiaal waarvoor je geen toestemming hebt.',
          ],
        },
        {
          h: 'Spelregels',
          p: [
            'Niet toegestaan: spam en oplichting, haatdragende taal, intimidatie of pesten, seksuele of onwettige inhoud, inbreuk op andermans rechten, nepaccounts, en pogingen om het platform te misbruiken of de beveiliging te omzeilen.',
            'Behandel andere makers met respect. Reageer je je niet zo? Dan kan je content of account worden verwijderd.',
          ],
        },
        {
          h: 'Eerlijk stemmen',
          p: [
            'Stem eerlijk. Uitslagen manipuleren met nepaccounts of bots is niet toegestaan en kan leiden tot verwijdering van stemmen, inzendingen of je account.',
          ],
        },
        {
          h: 'Moderatie',
          p: [
            'We mogen content of accounts die deze voorwaarden schenden aanpassen, verbergen of verwijderen en de toegang beperken. Je kunt misbruik melden via de rapporteer-knop in de app.',
          ],
        },
        {
          h: 'Beëindiging',
          p: [
            'Je kunt je account altijd zelf verwijderen in de instellingen. Wij kunnen een account schorsen of beëindigen bij ernstige of herhaalde overtredingen.',
          ],
        },
        {
          h: 'Aansprakelijkheid',
          p: [
            'SMPL wordt aangeboden "zoals het is", zonder garanties. Voor zover wettelijk toegestaan zijn we niet aansprakelijk voor indirecte schade of voor content die door gebruikers is geplaatst.',
          ],
        },
        {
          h: 'Toepasselijk recht',
          p: ['Op deze voorwaarden is Nederlands recht van toepassing.'],
        },
        {
          h: 'Contact',
          p: [`Vragen over deze voorwaarden? Mail ${CONTACT}.`],
        },
      ],
    },
    en: {
      title: 'Terms of Service',
      intro: 'These terms apply to everyone who uses SMPL. Please read them — by using SMPL you agree to them.',
      sections: [
        {
          h: 'Agreement',
          p: ['By creating an account or using SMPL, you agree to these terms and to our Privacy Policy.'],
        },
        {
          h: 'Your account',
          p: [
            'You must be at least 16 and provide accurate details.',
            'You are responsible for your account and for keeping your password secret. Turn on two-factor authentication for extra security.',
          ],
        },
        {
          h: 'What SMPL is',
          p: [
            'SMPL is a platform where makers get the same sample or open verse and make their own version of it. The community listens and votes. Same sample, different soul.',
          ],
        },
        {
          h: 'Your content and rights',
          p: [
            'You keep all rights to what you upload. You only grant SMPL a non-exclusive licence to store, play and display your submission on the platform so the battle and voting can work.',
            'You warrant that you hold the rights to everything you upload — including samples and recordings — or that your use is permitted. Do not post material you have no permission for.',
          ],
        },
        {
          h: 'House rules',
          p: [
            'Not allowed: spam and scams, hate speech, harassment or bullying, sexual or unlawful content, infringing anyone else’s rights, fake accounts, and attempts to abuse the platform or bypass its security.',
            'Treat other makers with respect. If you don’t, your content or account may be removed.',
          ],
        },
        {
          h: 'Fair voting',
          p: [
            'Vote honestly. Manipulating results with fake accounts or bots is not allowed and may lead to removal of votes, submissions or your account.',
          ],
        },
        {
          h: 'Moderation',
          p: [
            'We may edit, hide or remove content or accounts that break these terms and restrict access. You can report abuse with the report button in the app.',
          ],
        },
        {
          h: 'Termination',
          p: [
            'You can delete your account yourself at any time in settings. We may suspend or terminate an account for serious or repeated violations.',
          ],
        },
        {
          h: 'Liability',
          p: [
            'SMPL is provided “as is”, without warranties. To the extent permitted by law, we are not liable for indirect damages or for content posted by users.',
          ],
        },
        {
          h: 'Governing law',
          p: ['These terms are governed by the laws of the Netherlands.'],
        },
        {
          h: 'Contact',
          p: [`Questions about these terms? Email ${CONTACT}.`],
        },
      ],
    },
  },
}

export default function Legal({ doc }) {
  const { lang } = useI18n()
  const t = useT()
  const data = CONTENT[doc][lang] || CONTENT[doc].en
  const otherDoc = doc === 'privacy' ? 'terms' : 'privacy'

  return (
    <div className="mx-auto max-w-[760px] px-4 py-12 sm:px-6 sm:py-16">
      <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-faint">SMPL · {t(`legal.${doc}`)}</div>
      <h1 className="mt-3 font-sans text-[clamp(2.2rem,7vw,3.6rem)] font-bold uppercase leading-[0.9] tracking-tighter">
        {data.title}
      </h1>
      <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
        {lang === 'nl' ? 'Laatst bijgewerkt' : 'Last updated'}: {UPDATED}
      </div>

      <p className="mt-8 max-w-prose font-sans text-[15px] leading-relaxed text-muted">{data.intro}</p>

      <div className="mt-10 space-y-9">
        {data.sections.map((s, i) => (
          <section key={s.h}>
            <h2 className="flex items-baseline gap-3 font-sans text-lg font-semibold uppercase tracking-tight">
              <span className="font-mono text-[12px] text-faint tnum">{String(i + 1).padStart(2, '0')}</span>
              {s.h}
            </h2>
            <div className="mt-3 space-y-3 border-l border-line pl-5">
              {s.p.map((para, j) => (
                <p key={j} className="max-w-prose font-sans text-[14px] leading-relaxed text-muted">
                  {para}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <Link to={`/${otherDoc}`} className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink underline-offset-4 hover:underline">
          → {t(`legal.${otherDoc}`)}
        </Link>
        <Link to="/" className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted hover:text-ink">
          {t('notFound.home')}
        </Link>
      </div>
    </div>
  )
}
