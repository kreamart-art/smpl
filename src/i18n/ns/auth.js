// Login + signup screens. Domain terms (battle, beat, sample, producer, verse,
// drop, room) stay English in NL too; only the UI tissue is translated. Tone:
// lowercase, terse. Reuses common.login / common.signup / common.back / role.*.
export const auth = {
  en: {
    // —— login: hero
    'auth.login.eyebrow': 'Access',
    'auth.login.heroLine1': 'Log',
    'auth.login.heroLine2': 'in.',
    'auth.login.intro':
      'Use a quick-login chip, or your email and password. Accounts with two-factor on will ask for a code from your authenticator.',

    // —— login: email + password step
    'auth.login.title': 'Login',
    'auth.field.email': 'Email',
    'auth.field.password': 'Password',
    'auth.field.passwordHint': 'required',
    'auth.field.emailPlaceholder': 'you@smpl.app',
    'auth.field.passwordPlaceholder': '••••••••',
    'auth.login.enter': 'Enter',
    'auth.login.entering': 'Entering…',

    // —— login: two-factor step
    'auth.2fa.title': 'Two-factor',
    'auth.2fa.intro':
      'Enter the 6-digit code from your authenticator app. Lost it? Use one of your backup codes.',
    'auth.2fa.codePlaceholder': '000000',
    'auth.2fa.verify': 'Verify',
    'auth.2fa.checking': 'Checking…',
    'auth.2fa.back': '◂ Back to login',

    // —— login: quick login
    'auth.quick.title': 'Quick login',
    'auth.quick.note': 'All demo accounts · password “smpl”',
    'auth.quick.curator': 'manage battles',
    'auth.noAccount': 'No account?',
    'auth.signupArrow': 'Sign up ▸',

    // —— signup: hero
    'auth.signup.eyebrow': 'SMPL: enrolment',
    'auth.signup.intro1': 'Two layers: a',
    'auth.signup.introPublic': 'public file',
    'auth.signup.intro2': 'the room sees, and a',
    'auth.signup.introPrivate': 'private identity',
    'auth.signup.intro3':
      'only you see. In battle you are only your alias, never your name.',

    // —— signup: section 01 role
    'auth.signup.roleTitle': 'Choose a role',
    'auth.signup.roleProducerBlurb': 'Flip the sample, submit beats, build a battle record.',
    'auth.signup.roleArtistBlurb':
      'Drop verses or vocals on the beat. Rap, sing, spoken word. One take, the crowd decides.',
    'auth.signup.roleListenerBlurb':
      'Attend, play the room, vote for your favourite. No drops needed.',

    // —— signup: section 02 public
    'auth.signup.publicTitle': 'Public profile',
    'auth.signup.publicNote': 'Shown on your page',
    'auth.signup.uploadPhoto': 'Upload photo',
    'auth.signup.removePhoto': 'Remove',
    'auth.field.alias': 'Alias',
    'auth.field.aliasHint': 'your @handle (ALL CAPS, no spaces)',
    'auth.field.aliasPlaceholder': 'e.g. NULL.SET',
    'auth.field.location': 'Location',
    'auth.field.locationHint': 'city, country',
    'auth.field.locationPlaceholder': 'Rotterdam, NL',
    'auth.field.genres': 'Genres',
    'auth.field.genresHint': 'comma separated',
    'auth.field.genresPlaceholder': 'boom bap, glitch, lo-fi',
    'auth.field.bio': 'Bio',
    'auth.field.bioHint': 'optional',
    'auth.field.bioPlaceholder': 'What do you make, and on what?',

    // —— signup: section 03 private
    'auth.signup.privateTitle': 'Private identity',
    'auth.signup.privateNote': 'Never shown publicly',
    'auth.signup.privateBanner':
      'Verified on file · kept private: legal name, date of birth & email never reach the room.',
    'auth.field.legalName': 'Legal name',
    'auth.field.legalNameHint': 'private',
    'auth.field.legalNamePlaceholder': 'Your real name',
    'auth.field.dob': 'Date of birth',
    'auth.field.dobHint': 'private',
    'auth.field.emailPrivateHint': 'private',
    'auth.field.emailPrivatePlaceholder': 'you@mail.com',
    'auth.field.passwordSignupHint': 'required · min 4',

    // —— signup: submit
    'auth.signup.create': 'Create account',
    'auth.signup.already': 'Already here?',
    'auth.loginArrow': 'Login ▸',
  },
  nl: {
    // —— login: hero
    'auth.login.eyebrow': 'Toegang',
    'auth.login.heroLine1': 'Log',
    'auth.login.heroLine2': 'in.',
    'auth.login.intro':
      'Gebruik een quick-login chip, of je e-mail en wachtwoord. Accounts met twee-factor vragen om een code uit je authenticator.',

    // —— login: email + password step
    'auth.login.title': 'Inloggen',
    'auth.field.email': 'E-mail',
    'auth.field.password': 'Wachtwoord',
    'auth.field.passwordHint': 'verplicht',
    'auth.field.emailPlaceholder': 'jij@smpl.app',
    'auth.field.passwordPlaceholder': '••••••••',
    'auth.login.enter': 'Inloggen',
    'auth.login.entering': 'Bezig…',

    // —— login: two-factor step
    'auth.2fa.title': 'Twee-factor',
    'auth.2fa.intro':
      'Voer de 6-cijferige code uit je authenticator-app in. Kwijt? Gebruik een van je back-upcodes.',
    'auth.2fa.codePlaceholder': '000000',
    'auth.2fa.verify': 'Verifiëren',
    'auth.2fa.checking': 'Controleren…',
    'auth.2fa.back': '◂ Terug naar inloggen',

    // —— login: quick login
    'auth.quick.title': 'Quick login',
    'auth.quick.note': 'Alle demo-accounts · wachtwoord “smpl”',
    'auth.quick.curator': 'battles beheren',
    'auth.noAccount': 'Geen account?',
    'auth.signupArrow': 'Aanmelden ▸',

    // —— signup: hero
    'auth.signup.eyebrow': 'SMPL: inschrijving',
    'auth.signup.intro1': 'Twee lagen: een',
    'auth.signup.introPublic': 'publiek dossier',
    'auth.signup.intro2': 'dat de room ziet, en een',
    'auth.signup.introPrivate': 'privé-identiteit',
    'auth.signup.intro3':
      'die alleen jij ziet. In de battle ben je alleen je alias, nooit je naam.',

    // —— signup: section 01 role
    'auth.signup.roleTitle': 'Kies een rol',
    'auth.signup.roleProducerBlurb': 'Flip de sample, stuur beats in, bouw een battle-record op.',
    'auth.signup.roleArtistBlurb':
      'Drop verses of vocals op de beat. Rap, zang, spoken word. Één take, de crowd beslist.',
    'auth.signup.roleListenerBlurb':
      'Kom langs, voel de room, stem op je favoriet. Geen drops nodig.',

    // —— signup: section 02 public
    'auth.signup.publicTitle': 'Publiek profiel',
    'auth.signup.publicNote': 'Zichtbaar op je pagina',
    'auth.signup.uploadPhoto': 'Foto uploaden',
    'auth.signup.removePhoto': 'Verwijderen',
    'auth.field.alias': 'Alias',
    'auth.field.aliasHint': 'je @handle (ALL CAPS, geen spaties)',
    'auth.field.aliasPlaceholder': 'bijv. NULL.SET',
    'auth.field.location': 'Locatie',
    'auth.field.locationHint': 'stad, land',
    'auth.field.locationPlaceholder': 'Rotterdam, NL',
    'auth.field.genres': 'Genres',
    'auth.field.genresHint': 'komma-gescheiden',
    'auth.field.genresPlaceholder': 'boom bap, glitch, lo-fi',
    'auth.field.bio': 'Bio',
    'auth.field.bioHint': 'optioneel',
    'auth.field.bioPlaceholder': 'Wat maak je, en waarop?',

    // —— signup: section 03 private
    'auth.signup.privateTitle': 'Privé-identiteit',
    'auth.signup.privateNote': 'Nooit publiek zichtbaar',
    'auth.signup.privateBanner':
      'Geverifieerd in dossier · privé gehouden: wettelijke naam, geboortedatum & e-mail bereiken de room nooit.',
    'auth.field.legalName': 'Wettelijke naam',
    'auth.field.legalNameHint': 'privé',
    'auth.field.legalNamePlaceholder': 'Je echte naam',
    'auth.field.dob': 'Geboortedatum',
    'auth.field.dobHint': 'privé',
    'auth.field.emailPrivateHint': 'privé',
    'auth.field.emailPrivatePlaceholder': 'jij@mail.com',
    'auth.field.passwordSignupHint': 'verplicht · min 4',

    // —— signup: submit
    'auth.signup.create': 'Account aanmaken',
    'auth.signup.already': 'Al hier?',
    'auth.loginArrow': 'Inloggen ▸',
  },
}
