// Only drive the real <audio> element from URLs that are actually playable
// audio files (our uploads, or a direct file link), not SoundCloud/YouTube pages.
export const playableAudio = (u) =>
  !!u && (u.startsWith('/api/uploads/') || /\.(mp3|wav|m4a|aac|ogg|webm|flac)$/i.test(u))
