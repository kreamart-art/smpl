// One shared source, many interpretations. BEATS = flip a sample. VERSES = drop
// a verse on a beat. All kind-specific copy lives here so the UI stays one model.
export const KIND = { BEATS: 'BEATS', VERSES: 'VERSES' }

export function kindCopy(kind) {
  if (kind === 'VERSES') {
    return {
      kind: 'VERSES',
      label: 'VERSES',
      brand: 'SMPL // VERSES',
      glyph: '✎',
      sourceLabel: 'BEAT', // the shared source is a beat
      sourceVerb: 'Drop a verse on',
      competitor: 'artist',
      competitors: 'artists',
      competitorTitle: 'Artists',
      drop: 'verse',
      drops: 'verses',
      register: 'Claim a verse slot',
      submit: 'Drop verse',
      tagline: 'One beat. Sixteen bars. Judge the pen, not the name.',
    }
  }
  return {
    kind: 'BEATS',
    label: 'BEATS',
    brand: 'SMPL // BEATS',
    glyph: '≋',
    sourceLabel: 'SAMPLE',
    sourceVerb: 'Flip',
    competitor: 'producer',
    competitors: 'producers',
    competitorTitle: 'Producers',
    drop: 'beat',
    drops: 'beats',
    register: 'Claim a slot',
    submit: 'Submit beat',
    tagline: 'One sample. Infinite flips. Judge the beat, not the name.',
  }
}

export function roleLabel(role) {
  return { producer: 'Producer', artist: 'Artist', listener: 'Listener', curator: 'Curator', admin: 'Admin' }[role] || role
}

// Mirrors the server's register rule: the battle's competitor role, a dual-role
// maker, or staff who opted into competing. Never the battle's own curator.
export function canEnter(user, battle) {
  if (!user || !battle || battle.curatorId === user.id) return false
  const need = battle.kind === 'VERSES' ? 'artist' : 'producer'
  const competitor = user.role === 'producer' || user.role === 'artist'
  const staff = user.role === 'curator' || user.role === 'admin'
  return user.role === need || (!!user.dualRole && competitor) || (staff && !!user.curatorCompetes)
}

// display tags a member can show on their profile (the server holds the same list)
export const CREATIVE_ROLES = [
  'producer', 'beatmaker', 'rapper', 'vocalist', 'singer', 'songwriter', 'dj', 'engineer', 'musician', 'visual',
]
