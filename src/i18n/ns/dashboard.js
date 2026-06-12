// Curator console (/dashboard): restricted screen, create-battle panel,
// manage-battles panel. Domain terms (battle, beat, sample, producer, verse,
// curator, drop) stay English in NL too; only the UI tissue is translated.
// Tone: lowercase, terse. Shared status.* / kind.* / role.* / common.* keys
// live in ns/common.js and are reused here — not redefined.
export const dashboard = {
  en: {
    // restricted (non-curator) screen
    'dashboard.restricted.kicker': 'Restricted',
    'dashboard.restricted.title': 'Curator only',
    'dashboard.restricted.signedIn':
      'Signed in as {alias} ({role}). The console is reserved for curators.',
    'dashboard.restricted.anon': 'You need the curator account to run battles.',
    'dashboard.restricted.login': 'Login as curator',
    'dashboard.restricted.browse': 'Browse battles',

    // console header
    'dashboard.console.kicker': 'Curator console',
    'dashboard.console.title': 'Dashboard',

    // status messages
    'dashboard.msg.over30': 'That audio is over 30 MB — trim or bounce it smaller.',
    'dashboard.msg.uploaded': 'Uploaded {name}.',
    'dashboard.msg.uploadFailed': 'Upload failed.',
    'dashboard.msg.needTitle': 'Give the battle a title.',
    'dashboard.msg.created': 'Created "{title}" — now in {status}.',

    // create-battle panel
    'dashboard.create.title': 'Create battle',
    'dashboard.create.note': '→ {status}',
    'dashboard.create.fieldTitle': 'Title',
    'dashboard.create.fieldTitlePlaceholder': 'GHOST IN THE BREAK',
    'dashboard.create.type': 'Type',
    'dashboard.create.sampleArtist': 'Sample artist',
    'dashboard.create.beatBy': 'Beat by',
    'dashboard.create.artistPlaceholder': 'Dorothy Ashby',
    'dashboard.create.sampleTrack': 'Sample track',
    'dashboard.create.beatTitle': 'Beat title',
    'dashboard.create.songPlaceholder': 'Soul Vibrations',
    'dashboard.create.sampleAudio': 'Sample audio',
    'dashboard.create.theBeatAudio': 'The beat (audio)',
    'dashboard.create.audioHint': 'optional · mp3/wav/m4a · ≤30MB',
    'dashboard.create.upload': 'Upload audio',
    'dashboard.create.uploading': 'Uploading…',
    'dashboard.create.replace': 'Replace file',
    'dashboard.create.uploadedFallback': 'uploaded',
    'dashboard.create.audioHelp': 'Players hear this. No file = stylised silent waveform.',
    'dashboard.create.maxProducers': 'Max producers',
    'dashboard.create.description': 'Description',
    'dashboard.create.descriptionPlaceholder': "What's the brief?",
    'dashboard.create.revealNow': 'Reveal sample immediately',
    'dashboard.create.submit': 'Create battle',
    'dashboard.create.footnote': 'New battles start in {status}. Push them forward below.',

    // manage-battles panel
    'dashboard.manage.title': 'Manage battles',
    'dashboard.manage.note': '{n} total',
    'dashboard.manage.counts': '{p}/{max} prod · {n} beats · {a} here',
    'dashboard.manage.resolved': 'Resolved',
    'dashboard.manage.hide': 'Hide',
    'dashboard.manage.manage': 'Manage',
    'dashboard.manage.participants': 'Participants',
    'dashboard.manage.unknown': 'unknown',
    'dashboard.manage.approved': '· approved',
    'dashboard.manage.pending': '· pending',
    'dashboard.manage.approve': 'Approve',
    'dashboard.manage.unapprove': 'Unapprove',
    'dashboard.manage.declareWinner': 'Declare winner',
    'dashboard.manage.winner': '★ Winner',
    'dashboard.manage.noSubmissions': 'No submissions yet.',
    'dashboard.manage.registered': 'Registered: {names}',
  },
  nl: {
    // restricted (non-curator) screen
    'dashboard.restricted.kicker': 'afgeschermd',
    'dashboard.restricted.title': 'alleen curator',
    'dashboard.restricted.signedIn':
      'ingelogd als {alias} ({role}). de console is voor curators.',
    'dashboard.restricted.anon': 'je hebt het curator-account nodig om battles te draaien.',
    'dashboard.restricted.login': 'inloggen als curator',
    'dashboard.restricted.browse': 'battles bekijken',

    // console header
    'dashboard.console.kicker': 'curator console',
    'dashboard.console.title': 'Dashboard',

    // status messages
    'dashboard.msg.over30': 'die audio is groter dan 30 MB — knip of bounce hem kleiner.',
    'dashboard.msg.uploaded': '{name} geüpload.',
    'dashboard.msg.uploadFailed': 'uploaden mislukt.',
    'dashboard.msg.needTitle': 'geef de battle een titel.',
    'dashboard.msg.created': '"{title}" aangemaakt — nu in {status}.',

    // create-battle panel
    'dashboard.create.title': 'battle aanmaken',
    'dashboard.create.note': '→ {status}',
    'dashboard.create.fieldTitle': 'titel',
    'dashboard.create.fieldTitlePlaceholder': 'GHOST IN THE BREAK',
    'dashboard.create.type': 'type',
    'dashboard.create.sampleArtist': 'sample artist',
    'dashboard.create.beatBy': 'beat van',
    'dashboard.create.artistPlaceholder': 'Dorothy Ashby',
    'dashboard.create.sampleTrack': 'sample track',
    'dashboard.create.beatTitle': 'beat titel',
    'dashboard.create.songPlaceholder': 'Soul Vibrations',
    'dashboard.create.sampleAudio': 'sample audio',
    'dashboard.create.theBeatAudio': 'de beat (audio)',
    'dashboard.create.audioHint': 'optioneel · mp3/wav/m4a · ≤30MB',
    'dashboard.create.upload': 'audio uploaden',
    'dashboard.create.uploading': 'uploaden…',
    'dashboard.create.replace': 'bestand vervangen',
    'dashboard.create.uploadedFallback': 'geüpload',
    'dashboard.create.audioHelp': 'spelers horen dit. geen bestand = gestileerde stille waveform.',
    'dashboard.create.maxProducers': 'max producers',
    'dashboard.create.description': 'omschrijving',
    'dashboard.create.descriptionPlaceholder': 'wat is de brief?',
    'dashboard.create.revealNow': 'sample meteen tonen',
    'dashboard.create.submit': 'battle aanmaken',
    'dashboard.create.footnote': 'nieuwe battles starten in {status}. duw ze hieronder vooruit.',

    // manage-battles panel
    'dashboard.manage.title': 'battles beheren',
    'dashboard.manage.note': '{n} totaal',
    'dashboard.manage.counts': '{p}/{max} prod · {n} beats · {a} hier',
    'dashboard.manage.resolved': 'afgerond',
    'dashboard.manage.hide': 'verbergen',
    'dashboard.manage.manage': 'beheren',
    'dashboard.manage.participants': 'deelnemers',
    'dashboard.manage.unknown': 'onbekend',
    'dashboard.manage.approved': '· goedgekeurd',
    'dashboard.manage.pending': '· in afwachting',
    'dashboard.manage.approve': 'goedkeuren',
    'dashboard.manage.unapprove': 'goedkeuring intrekken',
    'dashboard.manage.declareWinner': 'winnaar uitroepen',
    'dashboard.manage.winner': '★ winnaar',
    'dashboard.manage.noSubmissions': 'nog geen inzendingen.',
    'dashboard.manage.registered': 'ingeschreven: {names}',
  },
}
