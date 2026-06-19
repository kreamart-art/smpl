// /battles/:id detail screen — header, phase pipeline, META grid, feedback +
// every phase panel (announced → winner). Domain terms (battle, beat, sample,
// producer, verse, drop, curator, room) stay English in NL; only UI tissue is
// translated. Kind-specific prose is keyed whole-sentence per battle.kind.
export const battleDetail = {
  en: {
    // header / nav
    'battleDetail.allBattles': '◂ All battles',
    'battleDetail.hereNow': 'Here now',
    'battleDetail.attend': "I'm in",
    'battleDetail.attending': "✓ I'm in",
    'battleDetail.curatedBy': 'Curated by {alias}',
    'battleDetail.shareTitle': 'SMPL · {title}',
    'battleDetail.shareText': '{title} · same sample, different soul. Battle on SMPL.',

    // sample caption (above the always-visible sample player)
    'battleDetail.sampleCaption.BEATS': 'The sample · everyone flips this',
    'battleDetail.sampleCaption.VERSES': 'The beat · everyone writes to this',
    'battleDetail.sealedSample': 'Sealed sample',
    'battleDetail.unknown': 'unknown',

    // META grid labels
    'battleDetail.meta.curator': 'Curator',
    'battleDetail.meta.slots': 'Slots',
    'battleDetail.meta.beatsIn': 'Beats in',
    'battleDetail.meta.versesIn': 'Verses in',

    // countdown captions (driven by status)
    'battleDetail.cd.signupOpens': 'SIGNUP OPENS',
    'battleDetail.cd.signupCloses': 'SIGNUP CLOSES',
    'battleDetail.cd.submissionsClose': 'SUBMISSIONS CLOSE',
    'battleDetail.cd.votingCloses': 'VOTING CLOSES',
    'battleDetail.cd.closed': 'CLOSED',
    'battleDetail.meta.closed': 'closed',

    // feedback messages
    'battleDetail.fb.loginTo': 'Log in to {action}.',
    'battleDetail.fb.action.attend': 'mark your presence',
    'battleDetail.fb.action.slot': 'claim a slot',
    'battleDetail.fb.action.vote': 'vote',
    'battleDetail.fb.slotClaimed': 'Slot claimed. You are in this battle.',
    'battleDetail.fb.submissionUpdated': 'Submission updated.',
    'battleDetail.fb.beatSubmitted': 'Beat submitted. Good luck.',
    'battleDetail.fb.voteCast': 'Vote cast. One per battle, that is final.',

    // ANNOUNCED panel
    'battleDetail.announced.title': 'Announced',
    'battleDetail.announced.sub': 'Signups not open yet.',
    'battleDetail.announced.bodyBefore': 'This battle is locked in. Hit ',
    'battleDetail.announced.bodyAfter.BEATS':
      ' to join the room and be ready when slots open. Producers, sharpen up.',
    'battleDetail.announced.bodyAfter.VERSES':
      ' to join the room and be ready when slots open. Artists, sharpen up.',

    // OPEN_FOR_SIGNUP panel
    'battleDetail.signup.title': 'Open for signup',
    'battleDetail.signup.sub': '{left} of {max} slots left',
    'battleDetail.signup.brief.BEATS':
      'Producers claim a slot to compete. Once submissions open you flip the sample above.',
    'battleDetail.signup.brief.VERSES':
      'Artists claim a slot to compete. Once submissions open you drop your verse on the beat.',
    'battleDetail.signup.registered': '✓ You are registered. Come back when submissions open.',
    'battleDetail.signup.claim.BEATS': 'Claim a slot',
    'battleDetail.signup.claim.VERSES': 'Claim a verse slot',
    'battleDetail.signup.listenersNote.BEATS':
      'Listeners can attend + vote, but only producers can compete here.',
    'battleDetail.signup.listenersNote.VERSES':
      'Listeners can attend + vote, but only artists can compete here.',

    // SUBMISSION_PHASE panel
    'battleDetail.submission.title': 'Submission phase',
    'battleDetail.submission.sub.BEATS': '{n} beats in so far',
    'battleDetail.submission.sub.VERSES': '{n} verses in so far',
    'battleDetail.submission.brief.BEATS':
      'Upload your beat. One submission: overwrite it until the phase closes.',
    'battleDetail.submission.brief.VERSES':
      'Upload your verse. One submission: overwrite it until the phase closes.',
    'battleDetail.submission.field.audio': 'Audio / file URL',
    'battleDetail.submission.field.soundcloud': 'SoundCloud',
    'battleDetail.submission.field.youtube': 'YouTube',
    'battleDetail.submission.hint.optional': 'optional',
    'battleDetail.submission.submit.BEATS': 'Submit beat',
    'battleDetail.submission.submit.VERSES': 'Drop verse',
    'battleDetail.submission.current.BEATS': 'Your beat is in. You can still swap it.',
    'battleDetail.submission.current.VERSES': 'Your verse is in. You can still swap it.',
    'battleDetail.submission.replaceHint':
      'Changed something? Upload a new file and update to replace it. Locks the moment submissions close.',
    'battleDetail.submission.update': 'Update entry',
    'battleDetail.submission.waiting.BEATS':
      'Beats are rolling in from registered producers. Voting opens when this phase closes. Stick around.',
    'battleDetail.submission.waiting.VERSES':
      'Verses are rolling in from registered artists. Voting opens when this phase closes. Stick around.',

    // VOTING_PHASE panel
    'battleDetail.voting.title': 'Voting phase',
    'battleDetail.voting.sub': 'Vote for your favourite · one per person · not your own',
    'battleDetail.voting.loginToVote': 'Log in to vote.',
    'battleDetail.voting.loginLink': 'Login ▸',
    'battleDetail.voting.voteIn': '✓ Your vote is in. Names + tallies appear when the curator declares the winner.',
    'battleDetail.voting.yourBeat': 'Your beat',
    'battleDetail.voting.empty': 'No beats were submitted.',

    // WINNER_DECLARED panel
    'battleDetail.winner.title': 'Winner declared',
    'battleDetail.winner.sub': 'Names revealed · the room has spoken',

    // not-found fallback
    'battleDetail.notFound': 'BATTLE NOT FOUND · {id}',
    'battleDetail.backToBattles': 'Back to battles',
  },
  nl: {
    // header / nav
    'battleDetail.allBattles': '◂ alle battles',
    'battleDetail.hereNow': 'nu hier',
    'battleDetail.attend': 'ik ben erbij',
    'battleDetail.attending': '✓ ik ben erbij',
    'battleDetail.curatedBy': 'gecureerd door {alias}',
    'battleDetail.shareTitle': 'SMPL · {title}',
    'battleDetail.shareText': '{title} · zelfde sample, andere ziel. Battle op SMPL.',

    // sample caption (above the always-visible sample player)
    'battleDetail.sampleCaption.BEATS': 'de sample · iedereen flipt deze',
    'battleDetail.sampleCaption.VERSES': 'de beat · iedereen schrijft hierop',
    'battleDetail.sealedSample': 'verzegelde sample',
    'battleDetail.unknown': 'onbekend',

    // META grid labels
    'battleDetail.meta.curator': 'curator',
    'battleDetail.meta.slots': 'slots',
    'battleDetail.meta.beatsIn': 'beats binnen',
    'battleDetail.meta.versesIn': 'verses binnen',

    // countdown captions (driven by status)
    'battleDetail.cd.signupOpens': 'INSCHRIJVING OPENT',
    'battleDetail.cd.signupCloses': 'INSCHRIJVING SLUIT',
    'battleDetail.cd.submissionsClose': 'INZENDEN SLUIT',
    'battleDetail.cd.votingCloses': 'STEMMEN SLUIT',
    'battleDetail.cd.closed': 'GESLOTEN',
    'battleDetail.meta.closed': 'gesloten',

    // feedback messages
    'battleDetail.fb.loginTo': 'log in om te {action}.',
    'battleDetail.fb.action.attend': 'je aanwezigheid te tonen',
    'battleDetail.fb.action.slot': 'een slot te claimen',
    'battleDetail.fb.action.vote': 'stemmen',
    'battleDetail.fb.slotClaimed': 'slot geclaimd. je zit in deze battle.',
    'battleDetail.fb.submissionUpdated': 'inzending bijgewerkt.',
    'battleDetail.fb.beatSubmitted': 'beat ingezonden. succes.',
    'battleDetail.fb.voteCast': 'stem uitgebracht. één per battle, en dat is definitief.',

    // ANNOUNCED panel
    'battleDetail.announced.title': 'aangekondigd',
    'battleDetail.announced.sub': 'inschrijving nog niet open.',
    'battleDetail.announced.bodyBefore': 'deze battle staat vast. tik ',
    'battleDetail.announced.bodyAfter.BEATS':
      ' om de room te joinen en klaar te staan als de slots opengaan. producers, slijp je bij.',
    'battleDetail.announced.bodyAfter.VERSES':
      ' om de room te joinen en klaar te staan als de slots opengaan. artists, slijp je bij.',

    // OPEN_FOR_SIGNUP panel
    'battleDetail.signup.title': 'inschrijving open',
    'battleDetail.signup.sub': '{left} van {max} slots over',
    'battleDetail.signup.brief.BEATS':
      'producers claimen een slot om mee te doen. zodra de inzendfase opent flip je de sample hierboven.',
    'battleDetail.signup.brief.VERSES':
      'artists claimen een slot om mee te doen. zodra de inzendfase opent drop je je verse op de beat.',
    'battleDetail.signup.registered': '✓ je bent ingeschreven. kom terug als de inzendfase opent.',
    'battleDetail.signup.claim.BEATS': 'claim een slot',
    'battleDetail.signup.claim.VERSES': 'claim een verse-slot',
    'battleDetail.signup.listenersNote.BEATS':
      'luisteraars kunnen erbij zijn + stemmen, maar alleen producers doen hier mee.',
    'battleDetail.signup.listenersNote.VERSES':
      'luisteraars kunnen erbij zijn + stemmen, maar alleen artists doen hier mee.',

    // SUBMISSION_PHASE panel
    'battleDetail.submission.title': 'inzendfase',
    'battleDetail.submission.sub.BEATS': '{n} beats tot nu toe binnen',
    'battleDetail.submission.sub.VERSES': '{n} verses tot nu toe binnen',
    'battleDetail.submission.brief.BEATS':
      'upload je beat. één inzending: overschrijf hem tot de fase sluit.',
    'battleDetail.submission.brief.VERSES':
      'upload je verse. één inzending: overschrijf hem tot de fase sluit.',
    'battleDetail.submission.field.audio': 'audio / bestand-URL',
    'battleDetail.submission.field.soundcloud': 'SoundCloud',
    'battleDetail.submission.field.youtube': 'YouTube',
    'battleDetail.submission.hint.optional': 'optioneel',
    'battleDetail.submission.submit.BEATS': 'beat inzenden',
    'battleDetail.submission.submit.VERSES': 'verse droppen',
    'battleDetail.submission.current.BEATS': 'je beat staat ingezonden. je kunt hem nog vervangen.',
    'battleDetail.submission.current.VERSES': 'je verse staat ingezonden. je kunt hem nog vervangen.',
    'battleDetail.submission.replaceHint':
      'iets aangepast? upload een nieuw bestand en update om hem te vervangen. gaat op slot zodra de inzendingen sluiten.',
    'battleDetail.submission.update': 'inzending updaten',
    'battleDetail.submission.waiting.BEATS':
      'beats stromen binnen van ingeschreven producers. stemmen opent zodra deze fase sluit. blijf hangen.',
    'battleDetail.submission.waiting.VERSES':
      'verses stromen binnen van ingeschreven artists. stemmen opent zodra deze fase sluit. blijf hangen.',

    // VOTING_PHASE panel
    'battleDetail.voting.title': 'stemfase',
    'battleDetail.voting.sub': 'stem op je favoriet · één per persoon · niet je eigen',
    'battleDetail.voting.loginToVote': 'log in om te stemmen.',
    'battleDetail.voting.loginLink': 'inloggen ▸',
    'battleDetail.voting.voteIn': '✓ je stem is binnen. namen + tellingen verschijnen als de curator de winnaar uitroept.',
    'battleDetail.voting.yourBeat': 'jouw beat',
    'battleDetail.voting.empty': 'er zijn geen beats ingezonden.',

    // WINNER_DECLARED panel
    'battleDetail.winner.title': 'winnaar bekend',
    'battleDetail.winner.sub': 'namen onthuld · de room heeft gesproken',

    // not-found fallback
    'battleDetail.notFound': 'BATTLE NIET GEVONDEN · {id}',
    'battleDetail.backToBattles': 'terug naar battles',
  },
}
