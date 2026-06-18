// Profile page + security panels (2FA, delete account). Domain terms (battle,
// beat, producer, curator, room) stay English in NL too; only the UI tissue is
// translated. Tone: lowercase, terse. Shared bits (followers, following, follow,
// edit, settings, log out, close, save, cancel, back, role.*) live in common.js.
export const profile = {
  en: {
    // banner
    'profile.artistFile': 'SMPL Artist File',
    'profile.curatorFile': 'SMPL Curator File',
    'profile.memberSince': 'Member since {month}',
    'profile.badge.curator': 'Curator · curates the room',
    'profile.badge.anon': 'Real name on file, kept private',

    // editor panel
    'profile.editProfile': 'Edit profile',
    'profile.closeX': 'Close ✕',
    'profile.uploadPhoto': 'Upload photo',
    'profile.removePhoto': 'Remove',
    'profile.field.bio': 'Bio',
    'profile.field.bioHint': '@mentions link',
    'profile.field.location': 'Location',
    'profile.field.genres': 'Genres',
    'profile.field.genresHint': 'comma separated',
    'profile.field.links': 'Links',
    'profile.field.linksHint': 'one per line: label, url',
    'profile.linksPlaceholder': 'soundcloud, https://…\nbandcamp, https://…',
    'profile.saving': 'Saving…',
    'profile.saveProfile': 'Save profile',
    'profile.saveError': 'Could not save.',

    // settings panel
    'profile.twoFactorAuth': 'Two-factor auth',
    'profile.deleteAccount': 'Delete account',
    'profile.on': 'On',
    'profile.off': 'Off',
    'profile.signedInAs': 'Signed in as {who} · SMPL v1.3',

    // private file
    'profile.privateFile': 'Private file',
    'profile.visibleOnlyToYou': 'Visible only to you',
    'profile.legalName': 'Legal name',
    'profile.dob': 'Date of birth',
    'profile.dobYears': '{dob} · {age} yrs',
    'profile.email': 'Email',
    'profile.privateFootnote':
      'Never shown publicly. SMPL verifies your identity and keeps your real name private.',

    // bio + links cards
    'profile.bio': 'Bio',
    'profile.noBio': 'No bio yet.',
    'profile.links': 'Links',
    'profile.noLinks': 'No links.',

    // statistics
    'profile.stats.kickerCurator': 'Curation figures',
    'profile.stats.kickerCareer': 'Career figures',
    'profile.stats.title': 'Statistics',
    // profile tabs (instagram/tiktok-style)
    'profile.tab.clips': 'Clips',
    'profile.tab.stats': 'Stats',
    'profile.tab.history': 'History',
    'profile.tab.battles': 'Battles',
    'profile.clips.empty': 'No clips yet.',
    'profile.clips.emptySelf': 'Turn one of your battle flips into a shareable clip from the battle page.',
    // competitor stats
    'profile.stats.battles': 'Battles',
    'profile.stats.battlesSub': 'played',
    'profile.stats.won': 'Won',
    'profile.stats.wonSub': 'first place',
    'profile.stats.winRatio': 'Win ratio',
    'profile.stats.totalVotes': 'Total votes',
    'profile.stats.totalVotesSub': 'career',
    // curator stats
    'profile.cstats.battles': 'Battles',
    'profile.cstats.battlesSub': 'curated',
    'profile.cstats.creators': 'Creators',
    'profile.cstats.creatorsSub': 'hosted',
    'profile.cstats.drops': 'Drops',
    'profile.cstats.dropsSub': 'submitted',
    'profile.cstats.winners': 'Winners',
    'profile.cstats.winnersSub': 'crowned',

    // curated battles
    'profile.curated.kicker': 'The catalogue',
    'profile.curated.title': 'Curated battles',
    'profile.curated.empty': 'No battles curated yet.',

    // battle history
    'profile.history.kicker': 'The record',
    'profile.history.title': 'Battle history',
    'profile.history.col.battle': 'Battle',
    'profile.history.col.position': 'Position',
    'profile.history.col.votes': 'Votes',
    'profile.history.col.date': 'Date',
    'profile.history.onSmpl': 'on smpl',
    'profile.history.empty': 'No battles played yet.',

    // not found
    'profile.notFound': 'PRODUCER NOT FOUND · {alias}',
    'profile.backToBattles': 'Back to battles',

    // share
    'profile.share.title': '@{alias} on SMPL',
    'profile.share.text': '@{alias} · {role} on SMPL. same sample, different soul.',

    // ----- security: two-factor -----
    'profile.tfa.onLabel': '2FA is ON',
    'profile.tfa.offLabel': '2FA is OFF',
    'profile.tfa.onExplain':
      'Your account asks for a 6-digit code from your authenticator app at every login.',
    'profile.tfa.offExplain':
      'Protect your account with an authenticator app (Google Authenticator, Authy, 1Password…). You’ll add a 6-digit code when you log in.',
    'profile.tfa.startError': 'Could not start setup.',
    'profile.tfa.turnOff': 'Turn off 2FA',
    'profile.tfa.starting': 'Starting…',
    'profile.tfa.setUp': 'Set up 2FA',
    'profile.tfa.step1': '1. Scan this in your authenticator app, or enter the key by hand.',
    'profile.tfa.qrAlt': '2FA QR code',
    'profile.tfa.qrLoading': 'QR…',
    'profile.tfa.manualKey': 'Manual key',
    'profile.tfa.step2': '2. Enter the 6-digit code it shows.',
    'profile.tfa.wrongCode': 'Wrong code.',
    'profile.tfa.verifying': 'Verifying…',
    'profile.tfa.verifyEnable': 'Verify & enable',
    'profile.tfa.onHeading': '2FA is on',
    'profile.tfa.codesExplain':
      'Save these backup codes somewhere safe. Each works once if you lose your authenticator. They’re shown only now.',
    'profile.tfa.copyCodes': 'Copy codes',
    'profile.tfa.done': 'Done',
    'profile.tfa.disableExplain': 'Confirm your password to turn 2FA off.',
    'profile.tfa.password': 'Password',
    'profile.tfa.wrongPassword': 'Wrong password.',
    'profile.tfa.turningOff': 'Turning off…',

    // ----- security: delete account -----
    'profile.del.warning':
      'This is permanent. Your profile, photo and follows are removed. Past battle results stay, but anonymised: your name is wiped from them. This can’t be undone.',
    'profile.del.password': 'Password',
    'profile.del.typeToConfirm': 'Type DELETE to confirm',
    'profile.del.confirmWord': 'DELETE',
    'profile.del.deleting': 'Deleting…',
    'profile.del.deleteForever': 'Delete forever',
    'profile.del.error': 'Could not delete the account.',
  },
  nl: {
    // banner
    'profile.artistFile': 'SMPL Artist File',
    'profile.curatorFile': 'SMPL Curator File',
    'profile.memberSince': 'lid sinds {month}',
    'profile.badge.curator': 'curator · cureert de room',
    'profile.badge.anon': 'echte naam vastgelegd, blijft privé',

    // editor panel
    'profile.editProfile': 'profiel bewerken',
    'profile.closeX': 'sluiten ✕',
    'profile.uploadPhoto': 'foto uploaden',
    'profile.removePhoto': 'verwijderen',
    'profile.field.bio': 'bio',
    'profile.field.bioHint': '@mentions linken',
    'profile.field.location': 'locatie',
    'profile.field.genres': 'genres',
    'profile.field.genresHint': 'komma-gescheiden',
    'profile.field.links': 'links',
    'profile.field.linksHint': 'één per regel: label, url',
    'profile.linksPlaceholder': 'soundcloud, https://…\nbandcamp, https://…',
    'profile.saving': 'opslaan…',
    'profile.saveProfile': 'profiel opslaan',
    'profile.saveError': 'opslaan mislukt.',

    // settings panel
    'profile.twoFactorAuth': 'tweestapsverificatie',
    'profile.deleteAccount': 'account verwijderen',
    'profile.on': 'aan',
    'profile.off': 'uit',
    'profile.signedInAs': 'ingelogd als {who} · SMPL v1.3',

    // private file
    'profile.privateFile': 'privébestand',
    'profile.visibleOnlyToYou': 'alleen zichtbaar voor jou',
    'profile.legalName': 'volledige naam',
    'profile.dob': 'geboortedatum',
    'profile.dobYears': '{dob} · {age} jr',
    'profile.email': 'e-mail',
    'profile.privateFootnote':
      'Nooit openbaar getoond. SMPL verifieert je identiteit en houdt je echte naam privé.',

    // bio + links cards
    'profile.bio': 'bio',
    'profile.noBio': 'nog geen bio.',
    'profile.links': 'links',
    'profile.noLinks': 'geen links.',

    // statistics
    'profile.stats.kickerCurator': 'curatiecijfers',
    'profile.stats.kickerCareer': 'carrièrecijfers',
    'profile.stats.title': 'statistieken',
    // profile tabs (instagram/tiktok-style)
    'profile.tab.clips': 'Clips',
    'profile.tab.stats': 'Stats',
    'profile.tab.history': 'Historie',
    'profile.tab.battles': 'Battles',
    'profile.clips.empty': 'Nog geen clips.',
    'profile.clips.emptySelf': 'Maak van een van je battle-flips een deelbare clip vanaf de battlepagina.',
    // competitor stats
    'profile.stats.battles': 'battles',
    'profile.stats.battlesSub': 'gespeeld',
    'profile.stats.won': 'gewonnen',
    'profile.stats.wonSub': 'eerste plaats',
    'profile.stats.winRatio': 'winratio',
    'profile.stats.totalVotes': 'totaal stemmen',
    'profile.stats.totalVotesSub': 'carrière',
    // curator stats
    'profile.cstats.battles': 'battles',
    'profile.cstats.battlesSub': 'gecureerd',
    'profile.cstats.creators': 'makers',
    'profile.cstats.creatorsSub': 'gehost',
    'profile.cstats.drops': 'drops',
    'profile.cstats.dropsSub': 'ingezonden',
    'profile.cstats.winners': 'winnaars',
    'profile.cstats.winnersSub': 'gekroond',

    // curated battles
    'profile.curated.kicker': 'de catalogus',
    'profile.curated.title': 'gecureerde battles',
    'profile.curated.empty': 'nog geen battles gecureerd.',

    // battle history
    'profile.history.kicker': 'het register',
    'profile.history.title': 'battle-historie',
    'profile.history.col.battle': 'battle',
    'profile.history.col.position': 'positie',
    'profile.history.col.votes': 'stemmen',
    'profile.history.col.date': 'datum',
    'profile.history.onSmpl': 'op smpl',
    'profile.history.empty': 'nog geen battles gespeeld.',

    // not found
    'profile.notFound': 'PRODUCER NIET GEVONDEN · {alias}',
    'profile.backToBattles': 'terug naar battles',

    // share
    'profile.share.title': '@{alias} op SMPL',
    'profile.share.text': '@{alias} · {role} op SMPL. same sample, different soul.',

    // ----- security: two-factor -----
    'profile.tfa.onLabel': '2FA staat AAN',
    'profile.tfa.offLabel': '2FA staat UIT',
    'profile.tfa.onExplain':
      'Je account vraagt bij elke login om een 6-cijferige code uit je authenticator-app.',
    'profile.tfa.offExplain':
      'Bescherm je account met een authenticator-app (Google Authenticator, Authy, 1Password…). Je voegt een 6-cijferige code toe wanneer je inlogt.',
    'profile.tfa.startError': 'opzetten mislukt.',
    'profile.tfa.turnOff': '2FA uitzetten',
    'profile.tfa.starting': 'bezig…',
    'profile.tfa.setUp': '2FA instellen',
    'profile.tfa.step1': '1. Scan dit in je authenticator-app, of voer de sleutel handmatig in.',
    'profile.tfa.qrAlt': '2FA QR-code',
    'profile.tfa.qrLoading': 'QR…',
    'profile.tfa.manualKey': 'handmatige sleutel',
    'profile.tfa.step2': '2. Voer de 6-cijferige code in die hij toont.',
    'profile.tfa.wrongCode': 'verkeerde code.',
    'profile.tfa.verifying': 'verifiëren…',
    'profile.tfa.verifyEnable': 'verifiëren & inschakelen',
    'profile.tfa.onHeading': '2FA staat aan',
    'profile.tfa.codesExplain':
      'Bewaar deze back-upcodes ergens veilig. Elke code werkt één keer als je je authenticator kwijtraakt. Ze worden alleen nu getoond.',
    'profile.tfa.copyCodes': 'codes kopiëren',
    'profile.tfa.done': 'klaar',
    'profile.tfa.disableExplain': 'Bevestig je wachtwoord om 2FA uit te zetten.',
    'profile.tfa.password': 'wachtwoord',
    'profile.tfa.wrongPassword': 'verkeerd wachtwoord.',
    'profile.tfa.turningOff': 'uitzetten…',

    // ----- security: delete account -----
    'profile.del.warning':
      'Dit is definitief. Je profiel, foto en follows worden verwijderd. Eerdere battle-uitslagen blijven, maar geanonimiseerd: je naam wordt eruit gewist. Dit kan niet ongedaan worden gemaakt.',
    'profile.del.password': 'wachtwoord',
    'profile.del.typeToConfirm': 'Typ DELETE om te bevestigen',
    'profile.del.confirmWord': 'DELETE',
    'profile.del.deleting': 'verwijderen…',
    'profile.del.deleteForever': 'definitief verwijderen',
    'profile.del.error': 'account verwijderen mislukt.',
  },
}
