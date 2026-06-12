import { STATUS } from './status.js'

export const CURATOR_EMAIL = 'curator@smpl.app'

const now = Date.now()
const MIN = 60 * 1000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

// ---------------------------------------------------------------------------
// USERS
// ---------------------------------------------------------------------------

export const seedUsers = [
  {
    id: 'curator',
    alias: 'SMPL',
    email: CURATOR_EMAIL,
    role: 'curator',
    name: 'SMPL Collective',
    dob: null,
    joinedAt: now - 540 * DAY,
    bio: 'House account. Picks the sample, holds the room, declares nothing lightly.',
    location: 'The Hague, NL',
    links: [{ label: 'site', url: '#' }],
    genres: ['curation'],
    pastHistory: [],
  },
  {
    id: 'u_koder',
    alias: 'KODER',
    email: 'koder@smpl.app',
    role: 'producer',
    name: 'Mees Dijkstra',
    dob: '1994-03-12',
    joinedAt: now - 470 * DAY,
    bio: 'Hardware-first beatmaker. SP-404 + a broken DX7. I chop what should not be chopped and apologise later.',
    location: 'Rotterdam, NL',
    links: [
      { label: 'soundcloud', url: '#' },
      { label: 'bandcamp', url: '#' },
      { label: 'instagram', url: '#' },
    ],
    genres: ['boom bap', 'glitch', 'lo-fi'],
    pastHistory: [
      { battle: 'COLD STORAGE / 004', position: 1, votes: 21, date: now - 26 * DAY },
      { battle: 'TAPE HISS / 002', position: 3, votes: 9, date: now - 61 * DAY },
      { battle: 'RUST BELT / 001', position: 2, votes: 14, date: now - 95 * DAY },
    ],
  },
  {
    id: 'u_mono',
    alias: 'mono.fault',
    email: 'mono@smpl.app',
    role: 'producer',
    name: 'Lena Brandt',
    dob: '1991-09-02',
    joinedAt: now - 505 * DAY,
    bio: 'Sound designer. I make samples confess. Modular into a laptop into a worse laptop. Berlin ↔ Lisbon.',
    location: 'Berlin, DE',
    links: [
      { label: 'soundcloud', url: '#' },
      { label: 'bandcamp', url: '#' },
      { label: 'website', url: '#' },
    ],
    genres: ['idm', 'breakbeat', 'ambient'],
    pastHistory: [
      { battle: 'COLD STORAGE / 004', position: 4, votes: 7, date: now - 26 * DAY },
      { battle: 'NIGHT BUS / 003', position: 1, votes: 24, date: now - 44 * DAY },
      { battle: 'TAPE HISS / 002', position: 1, votes: 18, date: now - 61 * DAY },
    ],
  },
  {
    id: 'u_vhs',
    alias: 'VHS_PRIEST',
    email: 'vhs@smpl.app',
    role: 'producer',
    name: 'Joren Maes',
    dob: '1989-11-23',
    joinedAt: now - 300 * DAY,
    bio: 'Tape saturation evangelist. Everything tracked to a 1987 deck before it counts.',
    location: 'Antwerp, BE',
    links: [{ label: 'soundcloud', url: '#' }],
    genres: ['plunderphonics', 'trip hop'],
    pastHistory: [{ battle: 'NIGHT BUS / 003', position: 5, votes: 4, date: now - 44 * DAY }],
  },
  {
    id: 'u_null',
    alias: 'null.set',
    email: 'null@smpl.app',
    role: 'producer',
    name: 'Kacper Nowak',
    dob: '1996-06-30',
    joinedAt: now - 210 * DAY,
    bio: 'Generative drums, hand-played mistakes. Half code, half coffee.',
    location: 'Warsaw, PL',
    links: [{ label: 'github', url: '#' }, { label: 'soundcloud', url: '#' }],
    genres: ['drum & bass', 'experimental'],
    pastHistory: [{ battle: 'RUST BELT / 001', position: 4, votes: 6, date: now - 95 * DAY }],
  },
  {
    id: 'u_ash',
    alias: 'ASHTRAY',
    email: 'ash@smpl.app',
    role: 'producer',
    name: 'Théo Rey',
    dob: '1990-01-17',
    joinedAt: now - 360 * DAY,
    bio: 'Dust, smoke, and an MPC2000XL that should be retired.',
    location: 'Marseille, FR',
    links: [{ label: 'bandcamp', url: '#' }],
    genres: ['boom bap', 'jazz'],
    pastHistory: [{ battle: 'TAPE HISS / 002', position: 2, votes: 12, date: now - 61 * DAY }],
  },
  {
    id: 'u_dither',
    alias: 'dither',
    email: 'dither@smpl.app',
    role: 'producer',
    name: 'Olivia Shaw',
    dob: '1993-08-08',
    joinedAt: now - 150 * DAY,
    bio: 'Lowercase techno. 8-bit ghosts. I quantise nothing.',
    location: 'Manchester, UK',
    links: [{ label: 'soundcloud', url: '#' }],
    genres: ['techno', 'glitch'],
    pastHistory: [{ battle: 'NIGHT BUS / 003', position: 3, votes: 11, date: now - 44 * DAY }],
  },
  {
    id: 'u_listener',
    alias: 'earwitness',
    email: 'listener@smpl.app',
    role: 'listener',
    name: 'Sam de Vries',
    dob: '1998-05-21',
    joinedAt: now - 90 * DAY,
    bio: 'Here to listen and to vote.',
    location: 'Amsterdam, NL',
    links: [],
    genres: [],
    pastHistory: [],
  },
  {
    id: 'u_vex',
    alias: 'VEX',
    email: 'vex@smpl.app',
    role: 'artist',
    name: 'Naomi Okafor',
    dob: '1997-02-19',
    joinedAt: now - 240 * DAY,
    bio: 'Drill + spoken word. One take or nothing. South London born, says too much.',
    location: 'London, UK',
    links: [
      { label: 'instagram', url: '#' },
      { label: 'soundcloud', url: '#' },
    ],
    genres: ['drill', 'grime', 'spoken word'],
    pastHistory: [{ battle: 'OPEN VERSE / 002', position: 1, votes: 17, date: now - 50 * DAY }],
  },
  {
    id: 'u_sable',
    alias: 'sable',
    email: 'sable@smpl.app',
    role: 'artist',
    name: 'Inès Laurent',
    dob: '1995-07-04',
    joinedAt: now - 190 * DAY,
    bio: 'Soul / RnB topliner. I write to the pocket and nowhere else.',
    location: 'Brussels, BE',
    links: [{ label: 'bandcamp', url: '#' }],
    genres: ['soul', 'r&b', 'neo-soul'],
    pastHistory: [{ battle: 'OPEN VERSE / 002', position: 2, votes: 12, date: now - 50 * DAY }],
  },
  {
    id: 'u_8tongue',
    alias: '8TONGUE',
    email: '8tongue@smpl.app',
    role: 'artist',
    name: 'Marcus Bell',
    dob: '1993-10-30',
    joinedAt: now - 120 * DAY,
    bio: 'Boom-bap lyricist. Multisyllabic or bust. Detroit.',
    location: 'Detroit, US',
    links: [{ label: 'youtube', url: '#' }],
    genres: ['boom bap', 'hip hop'],
    pastHistory: [],
  },
]

// ---------------------------------------------------------------------------
// BATTLES
// ---------------------------------------------------------------------------

export const seedBattles = [
  // 1 — VOTING PHASE, countdown running, 4 anonymous beats
  {
    id: 'b1',
    kind: 'BEATS',
    title: 'GHOST IN THE BREAK',
    sampleUrl: '',
    sampleArtist: 'Dorothy Ashby',
    sampleSong: 'Soul Vibrations (4-bar loop)',
    sampleDuration: 9,
    sampleRevealed: true,
    description:
      'One harp loop, sixteen seconds, no drums supplied. Flip it into something that haunts. Voting is live — back your favourite.',
    curatorId: 'curator',
    maxProducers: 8,
    signupStart: now - 9 * DAY,
    signupEnd: now - 7 * DAY,
    submitStart: now - 7 * DAY,
    submitEnd: now - 1 * DAY,
    voteStart: now - 1 * DAY,
    voteEnd: now + 6 * HOUR + 22 * MIN,
    status: STATUS.VOTING_PHASE,
    attendees: ['u_listener', 'u_ash', 'u_dither', 'curator'],
    signups: ['u_koder', 'u_mono', 'u_vhs', 'u_null'],
    winnerSubmissionId: null,
  },
  // 2 — OPEN FOR SIGNUP, upcoming
  {
    id: 'b2',
    kind: 'BEATS',
    title: '808 EXORCISM',
    sampleUrl: '',
    sampleArtist: 'Unknown',
    sampleSong: 'Field recording — cathedral organ',
    sampleDuration: 11,
    sampleRevealed: true,
    description:
      'A single sustained organ chord recorded inside an empty cathedral. Twelve slots. Bring drums or do not. Signups close soon — claim a slot to compete.',
    curatorId: 'curator',
    maxProducers: 12,
    signupStart: now - 1 * DAY,
    signupEnd: now + 2 * DAY + 3 * HOUR,
    submitStart: now + 2 * DAY + 3 * HOUR,
    submitEnd: now + 6 * DAY,
    voteStart: now + 6 * DAY,
    voteEnd: now + 9 * DAY,
    status: STATUS.OPEN_FOR_SIGNUP,
    attendees: ['u_listener', 'u_koder', 'curator', 'u_vhs', 'u_dither', 'u_ash'],
    signups: ['u_koder', 'u_dither'],
    winnerSubmissionId: null,
  },
  // 3 — WINNER DECLARED, fully resolved
  {
    id: 'b3',
    kind: 'BEATS',
    title: 'DUST & BONES',
    sampleUrl: '',
    sampleArtist: 'Alice Coltrane',
    sampleSong: 'Journey In Satchidananda (intro)',
    sampleDuration: 12,
    sampleRevealed: true,
    description:
      'The bassline that launched a thousand flips. Five producers, one drone. The room has spoken.',
    curatorId: 'curator',
    maxProducers: 8,
    signupStart: now - 40 * DAY,
    signupEnd: now - 37 * DAY,
    submitStart: now - 37 * DAY,
    submitEnd: now - 31 * DAY,
    voteStart: now - 31 * DAY,
    voteEnd: now - 28 * DAY,
    status: STATUS.WINNER_DECLARED,
    attendees: ['u_listener', 'u_koder', 'u_mono', 'u_ash', 'u_dither', 'u_vhs', 'curator'],
    signups: ['u_koder', 'u_mono', 'u_ash', 'u_dither', 'u_vhs'],
    winnerSubmissionId: 's3_mono',
  },
  // 4 — VERSES battle, voting live (artists drop a verse on one beat)
  {
    id: 'b4',
    kind: 'VERSES',
    title: 'CONFESSION BOOTH',
    sampleUrl: '',
    sampleArtist: 'prod. KODER',
    sampleSong: '92bpm soul cut',
    sampleDuration: 14,
    sampleRevealed: true,
    description:
      'One beat by KODER. Drop a verse — sixteen bars, one take. Voting is live — back your favourite.',
    curatorId: 'curator',
    maxProducers: 8,
    signupStart: now - 8 * DAY,
    signupEnd: now - 6 * DAY,
    submitStart: now - 6 * DAY,
    submitEnd: now - 1 * DAY,
    voteStart: now - 1 * DAY,
    voteEnd: now + 9 * HOUR + 40 * MIN,
    status: STATUS.VOTING_PHASE,
    attendees: ['u_listener', 'u_koder', 'curator', 'u_mono', 'u_dither'],
    signups: ['u_vex', 'u_sable', 'u_8tongue'],
    winnerSubmissionId: null,
  },
]

// ---------------------------------------------------------------------------
// SUBMISSIONS
// ---------------------------------------------------------------------------

export const seedSubmissions = [
  // Battle 1 (voting, anonymous)
  {
    id: 's1_koder',
    battleId: 'b1',
    producerId: 'u_koder',
    audioUrl: 'mock://b1/koder',
    soundcloudUrl: '#',
    youtubeUrl: '',
    duration: 16,
    createdAt: now - 2 * DAY,
    approved: true,
  },
  {
    id: 's1_mono',
    battleId: 'b1',
    producerId: 'u_mono',
    audioUrl: 'mock://b1/mono',
    soundcloudUrl: '',
    youtubeUrl: '#',
    duration: 14,
    createdAt: now - 2 * DAY,
    approved: true,
  },
  {
    id: 's1_vhs',
    battleId: 'b1',
    producerId: 'u_vhs',
    audioUrl: 'mock://b1/vhs',
    soundcloudUrl: '#',
    youtubeUrl: '',
    duration: 18,
    createdAt: now - 30 * HOUR,
    approved: true,
  },
  {
    id: 's1_null',
    battleId: 'b1',
    producerId: 'u_null',
    audioUrl: 'mock://b1/null',
    soundcloudUrl: '',
    youtubeUrl: '',
    duration: 15,
    createdAt: now - 28 * HOUR,
    approved: true,
  },

  // Battle 3 (resolved, revealed)
  {
    id: 's3_koder',
    battleId: 'b3',
    producerId: 'u_koder',
    audioUrl: 'mock://b3/koder',
    soundcloudUrl: '#',
    youtubeUrl: '',
    duration: 17,
    createdAt: now - 33 * DAY,
    approved: true,
  },
  {
    id: 's3_mono',
    battleId: 'b3',
    producerId: 'u_mono',
    audioUrl: 'mock://b3/mono',
    soundcloudUrl: '#',
    youtubeUrl: '#',
    duration: 15,
    createdAt: now - 33 * DAY,
    approved: true,
  },
  {
    id: 's3_ash',
    battleId: 'b3',
    producerId: 'u_ash',
    audioUrl: 'mock://b3/ash',
    soundcloudUrl: '#',
    youtubeUrl: '',
    duration: 16,
    createdAt: now - 32 * DAY,
    approved: true,
  },
  {
    id: 's3_dither',
    battleId: 'b3',
    producerId: 'u_dither',
    audioUrl: 'mock://b3/dither',
    soundcloudUrl: '',
    youtubeUrl: '#',
    duration: 14,
    createdAt: now - 32 * DAY,
    approved: true,
  },
  {
    id: 's3_vhs',
    battleId: 'b3',
    producerId: 'u_vhs',
    audioUrl: 'mock://b3/vhs',
    soundcloudUrl: '#',
    youtubeUrl: '',
    duration: 19,
    createdAt: now - 32 * DAY,
    approved: true,
  },

  // Battle 4 (VERSES, voting — anonymous)
  {
    id: 's4_vex',
    battleId: 'b4',
    producerId: 'u_vex',
    audioUrl: 'mock://b4/vex',
    soundcloudUrl: '#',
    youtubeUrl: '',
    duration: 22,
    createdAt: now - 2 * DAY,
    approved: true,
  },
  {
    id: 's4_sable',
    battleId: 'b4',
    producerId: 'u_sable',
    audioUrl: 'mock://b4/sable',
    soundcloudUrl: '',
    youtubeUrl: '#',
    duration: 19,
    createdAt: now - 2 * DAY,
    approved: true,
  },
  {
    id: 's4_8tongue',
    battleId: 'b4',
    producerId: 'u_8tongue',
    audioUrl: 'mock://b4/8tongue',
    soundcloudUrl: '#',
    youtubeUrl: '',
    duration: 25,
    createdAt: now - 30 * HOUR,
    approved: true,
  },
]

// ---------------------------------------------------------------------------
// VOTES — expand {submissionId: count} into individual Vote records so the
// one-vote-per-user model and voteCount() both work uniformly.
// ---------------------------------------------------------------------------

function expandVotes(battleId, counts) {
  const votes = []
  let n = 0
  for (const [submissionId, count] of Object.entries(counts)) {
    for (let i = 0; i < count; i++) {
      votes.push({
        id: `v_${battleId}_${n}`,
        battleId,
        submissionId,
        userId: `anon_${battleId}_${n}`,
      })
      n++
    }
  }
  return votes
}

export const seedVotes = [
  // Battle 1 — votes exist but stay hidden during the voting phase.
  ...expandVotes('b1', { s1_koder: 5, s1_mono: 7, s1_vhs: 3, s1_null: 4 }),
  // Battle 3 — final tallies. mono.fault wins.
  ...expandVotes('b3', { s3_mono: 14, s3_koder: 11, s3_vhs: 7, s3_dither: 5, s3_ash: 3 }),
  // Battle 4 — verses, hidden during voting.
  ...expandVotes('b4', { s4_vex: 6, s4_sable: 8, s4_8tongue: 4 }),
]

// ---------------------------------------------------------------------------
// FOLLOWS
// ---------------------------------------------------------------------------

export const seedFollows = [
  { followerId: 'u_listener', followeeId: 'u_koder' },
  { followerId: 'u_listener', followeeId: 'u_mono' },
  { followerId: 'u_ash', followeeId: 'u_koder' },
  { followerId: 'u_dither', followeeId: 'u_mono' },
  { followerId: 'u_vhs', followeeId: 'u_mono' },
  { followerId: 'u_null', followeeId: 'u_koder' },
  { followerId: 'u_koder', followeeId: 'u_mono' },
  { followerId: 'u_listener', followeeId: 'u_vex' },
  { followerId: 'u_koder', followeeId: 'u_sable' },
  { followerId: 'u_mono', followeeId: 'u_vex' },
  { followerId: 'u_dither', followeeId: 'u_8tongue' },
]
