// "Guess the Sample" — a listener mini-game.
//
// Server-authoritative by design (same stance as vote counting): the answer key
// and grading live ONLY here. The client is handed each question with its four
// options pre-shuffled and UNMARKED; it never sees which one is right until it
// has committed a pick and the server grades it. A score therefore cannot be
// forged — there is no client path that returns "14/14" without actually having
// answered each round correctly through /answer.
//
// The leaderboard is keyed to a real SMPL user id (any role, listeners included)
// — no free-text aliases, so nobody can impersonate a handle on a public board.

// The catalogue. `track`/`artist`/`answer`/`distractors` are proper names and
// stay as-is in every language. Only `fact` is localised (EN/NL — the two langs
// the app ships). Facts are factual; translated, never embellished.
const QUESTIONS = [
  { track: 'Stronger', artist: 'Kanye West', year: 2007,
    answer: 'Daft Punk — "Harder, Better, Faster, Stronger"',
    distractors: ['Kraftwerk — "Trans-Europe Express"', 'Giorgio Moroder — "I Feel Love"', 'Donna Summer — "Hot Stuff"'],
    fact: {
      en: `Kanye looped Daft Punk's 2001 robot-funk anthem and chopped the vocoder hook into his beat. The French duo joined him to play it live at the 2008 Grammys.`,
      nl: `Kanye loopte de robot-funk-hymne van Daft Punk uit 2001 en hakte de vocoder-hook in stukken voor zijn beat. Het Franse duo stond met hem op het podium om het live te spelen bij de Grammy's van 2008.` } },

  { track: 'Ice Ice Baby', artist: 'Vanilla Ice', year: 1990,
    answer: 'Queen & David Bowie — "Under Pressure"',
    distractors: ['The Police — "Every Breath You Take"', 'David Bowie — "Let\'s Dance"', 'Blondie — "Rapture"'],
    fact: {
      en: `That instantly recognizable bassline is lifted straight from the 1981 Queen/Bowie collaboration. Vanilla Ice first claimed it was different, it wasn't, and the originals were eventually credited.`,
      nl: `Die meteen herkenbare baslijn is rechtstreeks overgenomen van de samenwerking tussen Queen en Bowie uit 1981. Vanilla Ice beweerde eerst dat hij anders was, dat was niet zo, en uiteindelijk kregen de originele makers de credits.` } },

  { track: 'U Can\'t Touch This', artist: 'MC Hammer', year: 1990,
    answer: 'Rick James — "Super Freak"',
    distractors: ['Prince — "Kiss"', 'Chic — "Le Freak"', 'James Brown — "Sex Machine"'],
    fact: {
      en: `Hammer built the whole record on Rick James' 1981 funk riff. James sued, won a writing credit, and a Grammy out of it.`,
      nl: `Hammer bouwde de hele plaat op de funkriff van Rick James uit 1981. James klaagde hem aan, kreeg een schrijverscredit, en er een Grammy bovenop.` } },

  { track: 'Crazy in Love', artist: 'Beyoncé', year: 2003,
    answer: 'The Chi-Lites — "Are You My Woman? (Tell Me So)"',
    distractors: ['Earth, Wind & Fire — "September"', 'The Jackson 5 — "I Want You Back"', 'Kool & the Gang — "Celebration"'],
    fact: {
      en: `Producer Rich Harrison flipped the horn stab from the Chi-Lites' 1970 soul cut into that unmistakable 'uh-oh' fanfare.`,
      nl: `Producer Rich Harrison verbouwde de blazersstoot uit het soulnummer van The Chi-Lites uit 1970 tot die onmiskenbare 'uh-oh'-fanfare.` } },

  { track: 'I\'ll Be Missing You', artist: 'Puff Daddy', year: 1997,
    answer: 'The Police — "Every Breath You Take"',
    distractors: ['Phil Collins — "In the Air Tonight"', 'Sting — "Fields of Gold"', 'Hall & Oates — "Maneater"'],
    fact: {
      en: `Built on the Police's 1983 guitar figure as a tribute to The Notorious B.I.G., though Sting reportedly ended up with the lion's share of the royalties.`,
      nl: `Gebouwd op de gitaarfiguur van The Police uit 1983 als eerbetoon aan The Notorious B.I.G., al zou Sting uiteindelijk het leeuwendeel van de royalty's hebben opgestreken.` } },

  { track: 'Gold Digger', artist: 'Kanye West', year: 2005,
    answer: 'Ray Charles — "I Got a Woman"',
    distractors: ['Otis Redding — "Dock of the Bay"', 'Sam Cooke — "A Change Is Gonna Come"', 'Marvin Gaye — "Let\'s Get It On"'],
    fact: {
      en: `Jamie Foxx, fresh off playing Ray Charles in the film 'Ray', re-sang the hook that interpolates Charles' 1954 classic.`,
      nl: `Jamie Foxx, net na zijn rol als Ray Charles in de film 'Ray', zong de hook opnieuw in, die de klassieker van Charles uit 1954 interpoleert.` } },

  { track: 'Stan', artist: 'Eminem', year: 2000,
    answer: 'Dido — "Thank You"',
    distractors: ['Sarah McLachlan — "Angel"', 'Natalie Imbruglia — "Torn"', 'Sinéad O\'Connor — "Nothing Compares 2 U"'],
    fact: {
      en: `The haunting backdrop loops Dido's then-obscure song; the track's huge success helped vault her into stardom.`,
      nl: `Het beklemmende decor loopt Dido's toen nog onbekende nummer; het enorme succes van de track hielp haar naar de sterrenstatus.` } },

  { track: 'Paper Planes', artist: 'M.I.A.', year: 2007,
    answer: 'The Clash — "Straight to Hell"',
    distractors: ['The Ramones — "Blitzkrieg Bop"', 'Joy Division — "Love Will Tear Us Apart"', 'Talking Heads — "Once in a Lifetime"'],
    fact: {
      en: `The dreamy guitar loop comes from the Clash's 1982 track. The band's surviving members signed off on the sample.`,
      nl: `De dromerige gitaarloop komt uit het nummer van The Clash uit 1982. De nog levende bandleden gaven toestemming voor de sample.` } },

  { track: 'Right Round', artist: 'Flo Rida', year: 2009,
    answer: 'Dead or Alive — "You Spin Me Round (Like a Record)"',
    distractors: ['Wham! — "Wake Me Up Before You Go-Go"', 'Rick Astley — "Never Gonna Give You Up"', 'a-ha — "Take On Me"'],
    fact: {
      en: `The chorus reworks the 1984 hi-NRG smash that made Pete Burns a household name.`,
      nl: `Het refrein bewerkt de hi-NRG-hit uit 1984 die Pete Burns een begrip maakte.` } },

  { track: 'Hotline Bling', artist: 'Drake', year: 2015,
    answer: 'Timmy Thomas — "Why Can\'t We Live Together"',
    distractors: ['Bill Withers — "Ain\'t No Sunshine"', 'Al Green — "Let\'s Stay Together"', 'Gil Scott-Heron — "The Bottle"'],
    fact: {
      en: `That spare, woozy organ groove is built almost entirely on Timmy Thomas' lonely 1972 drum-machine ballad.`,
      nl: `Die kale, zweverige orgelgroove is bijna volledig gebouwd op Timmy Thomas' eenzame drummachine-ballad uit 1972.` } },

  { track: 'Levels', artist: 'Avicii', year: 2011,
    answer: 'Etta James — "Something\'s Got a Hold on Me"',
    distractors: ['Aretha Franklin — "Respect"', 'Nina Simone — "Feeling Good"', 'Tina Turner — "River Deep – Mountain High"'],
    fact: {
      en: `The euphoric vocal hook is sampled from Etta James' 1962 gospel-soul belter, the same line Flo Rida also borrowed for 'Good Feeling'.`,
      nl: `De euforische zang-hook is gesampled uit Etta James' gospel-soul-kraker uit 1962, dezelfde regel die Flo Rida ook leende voor 'Good Feeling'.` } },

  { track: 'Gangsta\'s Paradise', artist: 'Coolio', year: 1995,
    answer: 'Stevie Wonder — "Pastime Paradise"',
    distractors: ['Marvin Gaye — "What\'s Going On"', 'Curtis Mayfield — "Move On Up"', 'Bill Withers — "Lean on Me"'],
    fact: {
      en: `Coolio rebuilt Stevie Wonder's 1976 track almost note-for-note; Wonder reportedly approved it only after the profanity was toned down.`,
      nl: `Coolio bouwde Stevie Wonders nummer uit 1976 bijna noot voor noot na; Wonder gaf naar verluidt pas toestemming nadat het grove taalgebruik was afgezwakt.` } },

  { track: 'Mo Money Mo Problems', artist: 'The Notorious B.I.G.', year: 1997,
    answer: 'Diana Ross — "I\'m Coming Out"',
    distractors: ['Donna Summer — "I Feel Love"', 'Sister Sledge — "We Are Family"', 'Gloria Gaynor — "I Will Survive"'],
    fact: {
      en: `That shiny disco riff is straight off Diana Ross' 1980 anthem, itself crafted by Chic's Nile Rodgers and Bernard Edwards.`,
      nl: `Die glanzende discoriff komt rechtstreeks van Diana Ross' hymne uit 1980, die op zijn beurt werd geschreven door Nile Rodgers en Bernard Edwards van Chic.` } },

  { track: 'Break My Soul', artist: 'Beyoncé', year: 2022,
    answer: 'Robin S — "Show Me Love"',
    distractors: ['CeCe Peniston — "Finally"', 'Crystal Waters — "Gypsy Woman"', 'Black Box — "Ride on Time"'],
    fact: {
      en: `The pumping organ stab revives Robin S's 1993 house classic, a cornerstone of the genre Beyoncé saluted across the 'Renaissance' album.`,
      nl: `De stuwende orgelstoot blaast Robin S' house-klassieker uit 1993 nieuw leven in, een hoeksteen van het genre dat Beyoncé eerde op het album 'Renaissance'.` } },
]

const TOTAL = QUESTIONS.length
const SESSION_TTL = 30 * 60_000 // a game in progress lives 30 min
const MAX_SESSIONS = 5000 // safety cap on the in-memory store

function shuffle(a) {
  const r = a.slice()
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

// Monday-anchored UTC week bucket. The board resets every Monday 00:00 UTC so
// the top is never frozen by whoever first hit a perfect 14 — everyone gets a
// fresh shot each week and a reason to come back. `id` is the ISO date of that
// week's Monday; `endsAt` is next Monday (when the board rolls over).
function weekBounds(ts = Date.now()) {
  const d = new Date(ts)
  const dow = (d.getUTCDay() + 6) % 7 // Mon = 0 … Sun = 6
  const monday = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow)
  const nextMonday = monday + 7 * 24 * 60 * 60 * 1000
  return { id: new Date(monday).toISOString().slice(0, 10), endsAt: nextMonday }
}

export function mountGame(app, { db, ok, fail, rateLimit, langOf }) {
  // All-time best per user — kept as a harmless permanent record (history), but
  // the public board reads the WEEKLY table below, not this one.
  db.exec(`CREATE TABLE IF NOT EXISTS game_scores (
    userId TEXT PRIMARY KEY,
    best INTEGER NOT NULL DEFAULT 0,
    bestStreak INTEGER NOT NULL DEFAULT 0,
    bestAt INTEGER,
    plays INTEGER NOT NULL DEFAULT 0,
    updatedAt INTEGER
  )`)

  // Weekly board: one row per (week, user). best within that week; bestAt = when
  // it was first hit (earliest-wins tie-break, the SMPL stance). A new week =
  // new rows = a clean leaderboard.
  db.exec(`CREATE TABLE IF NOT EXISTS game_week_scores (
    weekId TEXT,
    userId TEXT,
    best INTEGER NOT NULL DEFAULT 0,
    bestStreak INTEGER NOT NULL DEFAULT 0,
    bestAt INTEGER,
    plays INTEGER NOT NULL DEFAULT 0,
    updatedAt INTEGER,
    PRIMARY KEY (weekId, userId)
  )`)
  db.exec('CREATE INDEX IF NOT EXISTS idx_week_scores ON game_week_scores (weekId, best DESC, bestAt ASC)')

  // sid -> { order:[qIdx], opts:[[strings]], correct:[idx], answered:[bool],
  //          score, streak, best, createdAt, finalized }
  const sessions = new Map()

  function prune() {
    const cutoff = Date.now() - SESSION_TTL
    for (const [sid, s] of sessions) if (s.createdAt < cutoff) sessions.delete(sid)
    // hard cap: if we somehow blow past the limit, drop the oldest sessions
    if (sessions.size > MAX_SESSIONS) {
      const sorted = [...sessions.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)
      for (let i = 0; i < sorted.length - MAX_SESSIONS; i++) sessions.delete(sorted[i][0])
    }
  }

  const newSid = () => 'g_' + Math.random().toString(36).slice(2) + Date.now().toString(36)

  // ---- start a round: build a fresh, shuffled, answer-stripped question set ----
  app.post('/api/game/start', rateLimit('gameStart', 40, 10 * 60_000), (req, res) => {
    prune()
    const order = shuffle(QUESTIONS.map((_, i) => i))
    const opts = [],
      correct = []
    for (const qi of order) {
      const q = QUESTIONS[qi]
      const choices = shuffle([q.answer, ...q.distractors])
      opts.push(choices)
      correct.push(choices.indexOf(q.answer))
    }
    const sid = newSid()
    sessions.set(sid, {
      order, opts, correct,
      answered: order.map(() => false),
      score: 0, streak: 0, best: 0,
      createdAt: Date.now(), finalized: false,
    })
    // hand the client everything it needs to play — but NOT the answer.
    const questions = order.map((qi, i) => {
      const q = QUESTIONS[qi]
      return { track: q.track, artist: q.artist, year: q.year, options: opts[i] }
    })
    return ok(res, { sid, total: TOTAL, questions })
  })

  // ---- grade one pick. Immediate per-round feedback, fully server-side. ----
  app.post('/api/game/answer', rateLimit('gameAnswer', 400, 10 * 60_000), (req, res) => {
    const { sid, q, pick } = req.body || {}
    const s = sessions.get(String(sid || ''))
    if (!s) return fail(res, 410, 'This round expired. Start a new one.')
    const qi = Number(q)
    if (!Number.isInteger(qi) || qi < 0 || qi >= TOTAL) return fail(res, 400, 'Bad question index.')
    const lang = langOf(req)
    const correctIdx = s.correct[qi]
    const answer = QUESTIONS[s.order[qi]].answer
    const fact = QUESTIONS[s.order[qi]].fact[lang] || QUESTIONS[s.order[qi]].fact.en

    // already answered → reply idempotently (tolerate double-clicks / retries)
    // without ever double-counting the score.
    if (s.answered[qi]) {
      return ok(res, {
        correct: s.picks?.[qi] === correctIdx, correctIndex: correctIdx, answer, fact,
        score: s.score, streak: s.streak, done: s.answered.every(Boolean), replay: true,
      })
    }

    const p = Number(pick)
    if (!Number.isInteger(p) || p < 0 || p > 3) return fail(res, 400, 'Bad pick.')
    s.picks = s.picks || s.order.map(() => -1)
    s.picks[qi] = p
    s.answered[qi] = true
    const correct = p === correctIdx
    if (correct) {
      s.score++
      s.streak++
      s.best = Math.max(s.best, s.streak)
    } else {
      s.streak = 0
    }

    const done = s.answered.every(Boolean)
    if (done && !s.finalized) {
      s.finalized = true
      // record to the leaderboard only for a signed-in member. Anyone can PLAY;
      // you appear on the board once you're a SMPL account (drives the point of
      // the platform — identity-tied reputation, no anonymous spoofing).
      if (req.user) finalize(req.user.id, s.score, s.best)
    }

    return ok(res, { correct, correctIndex: correctIdx, answer, fact, score: s.score, streak: s.streak, done })
  })

  // ---- audio preview proxy. The phone asks OUR server for an iTunes 30s
  // preview URL instead of reaching itunes.apple.com itself: in-app webviews,
  // iOS content blockers and some networks silently kill the cross-origin
  // lookup from the device (it shows up as "no preview"). Cached hard, since the
  // catalogue is static. A non-200 from Apple (e.g. rate-limit) is reported as
  // transient so the client can retry instead of caching a false "no preview".
  const itunesCache = new Map() // term -> { url, at }
  const PREVIEW_TTL = 7 * 24 * 60 * 60_000

  app.get('/api/game/preview', rateLimit('gamePreview', 300, 10 * 60_000), async (req, res) => {
    const term = String(req.query.term || '').slice(0, 120).trim()
    if (!term) return fail(res, 400, 'Missing term.')
    const hit = itunesCache.get(term)
    if (hit && Date.now() - hit.at < PREVIEW_TTL) return ok(res, { url: hit.url })
    let url = null
    try {
      const r = await fetch(
        'https://itunes.apple.com/search?media=music&entity=song&limit=6&term=' + encodeURIComponent(term),
        { headers: { 'User-Agent': 'SMPL/1.0 (+https://usesmpl.com)' } },
      )
      if (!r.ok) return ok(res, { url: null, transient: true })
      const data = await r.json()
      const found = (data.results || []).find((x) => x.previewUrl)
      if (found) url = found.previewUrl
    } catch {
      return ok(res, { url: null, transient: true })
    }
    itunesCache.set(term, { url, at: Date.now() })
    return ok(res, { url })
  })

  // upsert "keep the best, count the play" against either score table.
  function bumpBest(table, keyCols, keyVals, score, bestStreak, now) {
    const where = keyCols.map((c) => `${c} = ?`).join(' AND ')
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${where}`).get(...keyVals)
    if (!row) {
      const cols = [...keyCols, 'best', 'bestStreak', 'bestAt', 'plays', 'updatedAt']
      const qs = cols.map(() => '?').join(',')
      db.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${qs})`).run(
        ...keyVals, score, bestStreak, now, 1, now,
      )
      return
    }
    const beat = score > row.best
    db.prepare(
      `UPDATE ${table} SET best=?, bestStreak=?, bestAt=?, plays=plays+1, updatedAt=? WHERE ${where}`,
    ).run(
      beat ? score : row.best,
      Math.max(row.bestStreak || 0, bestStreak),
      beat ? now : row.bestAt,
      now,
      ...keyVals,
    )
  }

  function finalize(userId, score, bestStreak) {
    const now = Date.now()
    const { id: weekId } = weekBounds(now)
    // permanent all-time record (history) + the live weekly board
    bumpBest('game_scores', ['userId'], [userId], score, bestStreak, now)
    bumpBest('game_week_scores', ['weekId', 'userId'], [weekId, userId], score, bestStreak, now)
  }

  // ---- the board: THIS WEEK's top players + the caller's own standing ----
  app.get('/api/game/leaderboard', (req, res) => {
    const { id: weekId, endsAt } = weekBounds()
    const rows = db
      .prepare(
        `SELECT g.userId, g.best, g.bestStreak, g.bestAt, g.plays,
                u.alias, u.avatar, u.role, u.verified
           FROM game_week_scores g JOIN users u ON u.id = g.userId
          WHERE g.weekId = ?
          ORDER BY g.best DESC, g.bestAt ASC, u.alias ASC
          LIMIT 20`,
      )
      .all(weekId)
    const top = rows.map((r, i) => ({
      rank: i + 1,
      alias: r.alias,
      avatar: r.avatar || '',
      role: r.role === 'admin' ? 'curator' : r.role, // admins read as curators publicly
      verified: !!r.verified,
      best: r.best,
      bestStreak: r.bestStreak || 0,
      plays: r.plays,
    }))

    let me = null
    if (req.user) {
      const mine = db
        .prepare('SELECT * FROM game_week_scores WHERE weekId = ? AND userId = ?')
        .get(weekId, req.user.id)
      if (mine) {
        // rank = how many sit strictly above me this week under the same ordering, + 1
        const above = db
          .prepare(
            `SELECT COUNT(*) AS c FROM game_week_scores g JOIN users u ON u.id = g.userId
              WHERE g.weekId = ? AND (g.best > ? OR (g.best = ? AND g.bestAt < ?))`,
          )
          .get(weekId, mine.best, mine.best, mine.bestAt).c
        me = { rank: above + 1, best: mine.best, bestStreak: mine.bestStreak || 0, plays: mine.plays, alias: req.user.alias }
      }
    }
    const total = db.prepare('SELECT COUNT(*) AS c FROM game_week_scores WHERE weekId = ?').get(weekId).c
    return ok(res, { top, me, total, authed: !!req.user, weekId, endsAt })
  })
}
