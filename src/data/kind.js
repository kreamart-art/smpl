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
