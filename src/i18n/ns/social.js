// Social surfaces: feed (the wire), alerts (notifications) and people (who to
// follow). Domain terms (battle, beat, feed, drop, producer, curator) stay
// English in NL too; only the UI tissue is translated. Tone: lowercase, terse.
// Feed + Alerts share the activity-line phrasings below so they never drift.
export const social = {
  en: {
    // feed header
    'social.feed.eyebrow': 'The wire',
    'social.feed.tabFollowing': 'following',
    'social.feed.tabAll': 'all',

    // alerts header
    'social.alerts.eyebrow': 'Your wire',
    'social.alerts.loggedOut': 'Log in to see alerts from battles and the makers you follow.',

    // activity lines (shared by feed + alerts) — {handle} {title} {position} inserted
    'social.act.winner': '{handle} won {title}',
    'social.act.votesSuffix': '· {votes} votes',
    'social.act.placement': '{handle} placed #{position} in {title}',
    'social.act.voting': '{title} is open for voting',
    'social.act.votingBlind': '{title} is open for voting — judge it blind',
    'social.act.signup': '{title} opened for signup',
    'social.act.submission': '{title} — submissions open',
    'social.act.submissionLong': '{title} — submissions are open',
    'social.act.announced': 'New battle — {title}',
    'social.act.announcedLong': 'New battle announced — {title}',

    // row affordances
    'social.row.open': 'open ▸',
    'social.time.soon': 'soon',
    'social.time.justNow': 'just now',
    'social.time.now': 'now',

    // empty states
    'social.feed.emptyFollowingPre': 'Quiet here. Follow makers on',
    'social.feed.emptyFollowingPost': 'to fill your wire.',
    'social.feed.emptyAll': 'No activity yet.',
    'social.alerts.emptyPre': 'Quiet. Follow makers on',
    'social.alerts.emptyPost': 'to fill your alerts.',

    // people
    'social.people.eyebrow': 'Who to follow',
    'social.people.filterAll': 'ALL',
    'social.people.filterProducers': 'PRODUCERS',
    'social.people.filterArtists': 'ARTISTS',
    'social.people.followerOne': 'follower',
    'social.people.followerMany': 'followers',
    'social.people.you': 'You',
    'social.people.empty': 'No one here yet.',
  },
  nl: {
    // feed header
    'social.feed.eyebrow': 'De wire',
    'social.feed.tabFollowing': 'volgend',
    'social.feed.tabAll': 'alles',

    // alerts header
    'social.alerts.eyebrow': 'Jouw wire',
    'social.alerts.loggedOut': 'log in om meldingen te zien van battles en de makers die je volgt.',

    // activity lines (shared by feed + alerts) — {handle} {title} {position} inserted
    'social.act.winner': '{handle} won {title}',
    'social.act.votesSuffix': '· {votes} stemmen',
    'social.act.placement': '{handle} werd #{position} in {title}',
    'social.act.voting': '{title} staat open voor stemmen',
    'social.act.votingBlind': '{title} staat open voor stemmen — beoordeel blind',
    'social.act.signup': '{title} is open voor inschrijving',
    'social.act.submission': '{title} — inzendingen open',
    'social.act.submissionLong': '{title} — inzendingen zijn open',
    'social.act.announced': 'nieuwe battle — {title}',
    'social.act.announcedLong': 'nieuwe battle aangekondigd — {title}',

    // row affordances
    'social.row.open': 'open ▸',
    'social.time.soon': 'binnenkort',
    'social.time.justNow': 'zojuist',
    'social.time.now': 'nu',

    // empty states
    'social.feed.emptyFollowingPre': 'stil hier. volg makers op',
    'social.feed.emptyFollowingPost': 'om je wire te vullen.',
    'social.feed.emptyAll': 'nog geen activiteit.',
    'social.alerts.emptyPre': 'stil. volg makers op',
    'social.alerts.emptyPost': 'om je meldingen te vullen.',

    // people
    'social.people.eyebrow': 'wie te volgen',
    'social.people.filterAll': 'ALLE',
    'social.people.filterProducers': 'PRODUCERS',
    'social.people.filterArtists': 'ARTIESTEN',
    'social.people.followerOne': 'volger',
    'social.people.followerMany': 'volgers',
    'social.people.you': 'jij',
    'social.people.empty': 'nog niemand hier.',
  },
}
