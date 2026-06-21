import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react'
import { STATUS } from '../data/status.js'
import { api, setToken, getToken, mediaUrl } from '../api.js'

// Locally-stored set of authenticated sessions, so house accounts (admin +
// @SMPL) can switch back and forth without re-login. Each entry carries its own
// bearer token; switching is just swapping the active token + re-bootstrapping.
const SESSIONS_KEY = 'smpl_sessions'
const readSessions = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]')
  } catch {
    return []
  }
}
const writeSessions = (list) => {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

// ===========================================================================
// APP CONTEXT — now backed by the Express + SQLite API. The client holds a
// cache hydrated from /api/bootstrap; every mutation hits the API and then
// re-syncs. Server enforces anonymity, so voting-phase submissions arrive
// without producer identity (only a `mine` flag).
// ===========================================================================

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

export function AppProvider({ children }) {
  const [users, setUsers] = useState([])
  const [battles, setBattles] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [votes, setVotes] = useState([])
  const [follows, setFollows] = useState([])
  const [myVotes, setMyVotes] = useState({})
  const [myPredictions, setMyPredictions] = useState({})
  const [currentUser, setCurrentUser] = useState(null)
  const [accountSessions, setAccountSessions] = useState(readSessions)
  const [toast, setToast] = useState(null)
  const [unread, setUnread] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [blocked, setBlocked] = useState([])
  const [cratedIds, setCratedIds] = useState([])
  const [mailConfigured, setMailConfigured] = useState(false)
  const [pushConfigured, setPushConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const applyBootstrap = useCallback((d) => {
    setUsers(d.users || [])
    setBattles(d.battles || [])
    setSubmissions(d.submissions || [])
    setVotes(d.votes || [])
    setFollows(d.follows || [])
    setMyVotes(d.myVotes || {})
    setMyPredictions(d.myPredictions || {})
    setCurrentUser(d.me || null)
    setUnread(d.unread || 0)
    setUnreadMessages(d.unreadMessages || 0)
    setBlocked(d.blocked || [])
    setCratedIds(d.cratedIds || [])
    setMailConfigured(!!d.mailConfigured)
    setPushConfigured(!!d.pushConfigured)
  }, [])

  const refresh = useCallback(async () => {
    const d = await api.get('/api/bootstrap')
    if (d.ok) applyBootstrap(d)
    return d
  }, [applyBootstrap])

  useEffect(() => {
    let alive = true
    ;(async () => {
      const d = await api.get('/api/bootstrap')
      if (!alive) return
      if (d.ok) applyBootstrap(d)
      else setError(d.error || 'Failed to load.')
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [applyBootstrap])

  // Mirror the unread-DM count onto the installed app's home-screen icon badge
  // (Web Badging API). A no-op on browsers/devices that don't support it.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('setAppBadge' in navigator)) return
    const n = unreadMessages || 0
    try {
      if (n > 0) navigator.setAppBadge(n)
      else navigator.clearAppBadge()
    } catch {
      /* not installed / unsupported — ignore */
    }
  }, [unreadMessages])

  // Keep the active account's session (with its live token) in the local store,
  // so we can hop back to it later without a password.
  useEffect(() => {
    if (!currentUser) return
    const token = getToken()
    if (!token) return
    setAccountSessions((prev) => {
      const entry = {
        id: currentUser.id,
        alias: currentUser.alias,
        avatar: currentUser.avatar || '',
        role: currentUser.role,
        token,
      }
      const next = [entry, ...prev.filter((s) => s.id !== currentUser.id)]
      writeSessions(next)
      return next
    })
  }, [currentUser])

  const dismissToast = useCallback(() => setToast(null), [])

  // Near-real-time: poll a fresh bootstrap while the tab is visible so the bell
  // badge, unread DMs and follower list stay current without a manual refresh.
  useEffect(() => {
    if (!currentUser?.id) return undefined
    const tick = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') refresh()
    }
    const id = setInterval(tick, 25_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [currentUser?.id, refresh])

  // Detect a brand-new follower across refreshes → surface a live toast.
  const prevFollowers = useRef(null)
  useEffect(() => {
    if (!currentUser) {
      prevFollowers.current = null
      return
    }
    const mine = new Set(
      follows.filter((f) => f.followeeId === currentUser.id).map((f) => f.followerId),
    )
    if (prevFollowers.current) {
      for (const fid of mine) {
        if (!prevFollowers.current.has(fid)) {
          const u = users.find((x) => x.id === fid)
          if (u) setToast({ kind: 'follow', alias: u.alias, avatar: u.avatar || '', id: fid })
        }
      }
    }
    prevFollowers.current = mine
  }, [follows, users, currentUser])

  // --- selectors -----------------------------------------------------------
  const getBattle = useCallback((id) => battles.find((b) => b.id === id) || null, [battles])
  const getUser = useCallback((id) => users.find((u) => u.id === id) || null, [users])
  const getUserByAlias = useCallback(
    (alias) => users.find((u) => u.alias.toLowerCase() === String(alias).toLowerCase()) || null,
    [users],
  )
  const battleSubmissions = useCallback(
    (battleId) => submissions.filter((s) => s.battleId === battleId),
    [submissions],
  )
  const voteCount = useCallback(
    (submissionId) => votes.filter((v) => v.submissionId === submissionId).length,
    [votes],
  )
  // Only the requester's own vote is ever known client-side (server hides the rest).
  const userVoteInBattle = useCallback(
    (battleId) => (myVotes[battleId] ? { submissionId: myVotes[battleId] } : null),
    [myVotes],
  )
  const myPrediction = useCallback((battleId) => myPredictions[battleId] || null, [myPredictions])
  const followerCount = useCallback(
    (userId) => follows.filter((f) => f.followeeId === userId).length,
    [follows],
  )
  const isBlocked = useCallback((userId) => blocked.includes(userId), [blocked])
  const isFollowing = useCallback(
    (userId) =>
      !!currentUser && follows.some((f) => f.followerId === currentUser.id && f.followeeId === userId),
    [follows, currentUser],
  )

  const rankedSubmissions = useCallback(
    (battleId) =>
      battleSubmissions(battleId)
        .filter((s) => !s.disqualified) // disqualified entries are out of the running
        .map((s) => ({ ...s, votes: voteCount(s.id) }))
        .sort((a, b) => b.votes - a.votes),
    [battleSubmissions, voteCount],
  )

  const producerStats = useCallback(
    (userId) => {
      const user = users.find((u) => u.id === userId)
      const liveResults = []
      for (const b of battles) {
        if (b.status !== STATUS.WINNER_DECLARED) continue
        const ranked = rankedSubmissions(b.id)
        const idx = ranked.findIndex((s) => s.producerId === userId)
        if (idx === -1) continue
        liveResults.push({
          battle: b.title,
          battleId: b.id,
          position: idx + 1,
          votes: ranked[idx].votes,
          date: b.voteEnd,
          live: true,
        })
      }
      const past = (user?.pastHistory || []).map((h) => ({ ...h, live: false }))
      const history = [...liveResults, ...past].sort((a, b) => b.date - a.date)
      const played = history.length
      const won = history.filter((h) => h.position === 1).length
      const totalVotes = history.reduce((acc, h) => acc + (h.votes || 0), 0)
      return {
        played,
        won,
        totalVotes,
        winRatio: played ? Math.round((won / played) * 100) : 0,
        history,
      }
    },
    [users, battles, rankedSubmissions],
  )

  // Curator-side figures: battles they run + who/what they've hosted.
  const curatorStats = useCallback(
    (userId) => {
      const curated = battles.filter((b) => b.curatorId === userId)
      const ids = new Set(curated.map((b) => b.id))
      const creators = new Set()
      for (const b of curated) for (const s of b.signups || []) creators.add(s)
      const drops = submissions.filter((s) => ids.has(s.battleId)).length
      const winners = curated.filter((b) => b.status === STATUS.WINNER_DECLARED).length
      const live = curated.filter(
        (b) => b.status === STATUS.VOTING_PHASE || b.status === STATUS.SUBMISSION_PHASE,
      ).length
      const sorted = [...curated].sort((a, b) => (b.signupStart || 0) - (a.signupStart || 0))
      return { curated: sorted, count: curated.length, creators: creators.size, drops, winners, live }
    },
    [battles, submissions],
  )

  // --- auth ----------------------------------------------------------------
  const login = useCallback(
    async (identifier, password) => {
      const r = await api.post('/api/auth/login', { identifier, password })
      // r.needs2fa → hold here; the caller collects a code and calls verify2fa.
      if (r.ok && r.token) {
        setToken(r.token)
        await refresh()
      }
      return r
    },
    [refresh],
  )

  // Change (or first-time set, for passwordless accounts) the password while
  // signed in. Refreshes `me` so hasPassword flips.
  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      const r = await api.post('/api/auth/change-password', { currentPassword, newPassword })
      if (r.ok) await refresh()
      return r
    },
    [refresh],
  )

  const verify2fa = useCallback(
    async (ticket, code) => {
      const r = await api.post('/api/auth/2fa', { ticket, code })
      if (r.ok && r.token) {
        setToken(r.token)
        await refresh()
      }
      return r
    },
    [refresh],
  )

  const signup = useCallback(
    async (payload) => {
      const r = await api.post('/api/auth/signup', payload)
      if (r.ok) {
        setToken(r.token)
        await refresh()
      }
      return r
    },
    [refresh],
  )

  // passwordless: send a magic link, consume it (existing → session, new →
  // signup ticket), then finalize a new listener account from the ticket.
  const magicSend = useCallback((email) => api.post('/api/auth/magic', { email }), [])
  const magicConsume = useCallback(
    async (token) => {
      const r = await api.post('/api/auth/magic/consume', { token })
      if (r.ok && r.token) {
        setToken(r.token)
        await refresh()
      }
      return r
    },
    [refresh],
  )
  const finalizeSignup = useCallback(
    async (payload) => {
      const r = await api.post('/api/auth/finalize', payload)
      if (r.ok && r.token) {
        setToken(r.token)
        await refresh()
      }
      return r
    },
    [refresh],
  )

  const logout = useCallback(async () => {
    setToken(null)
    writeSessions([])
    setAccountSessions([])
    await refresh()
  }, [refresh])

  // --- house-account switcher ----------------------------------------------
  const fetchHouseAccounts = useCallback(() => api.get('/api/admin/accounts'), [])
  // Switch the active account. If we already hold a token for it (a prior
  // session), swap client-side; otherwise mint one via the admin endpoint.
  const switchAccount = useCallback(
    async (userId) => {
      if (currentUser?.id === userId) return { ok: true }
      const sess = readSessions().find((s) => s.id === userId)
      if (sess?.token) {
        setToken(sess.token)
        const r = await refresh()
        return r.ok ? { ok: true } : r
      }
      const r = await api.post('/api/admin/switch', { userId })
      if (r.ok && r.token) {
        setToken(r.token)
        await refresh()
        return { ok: true }
      }
      return r
    },
    [currentUser, refresh],
  )
  const removeSession = useCallback((userId) => {
    setAccountSessions((prev) => {
      const next = prev.filter((s) => s.id !== userId)
      writeSessions(next)
      return next
    })
  }, [])

  // --- password reset + email verification ---------------------------------
  const requestPasswordReset = useCallback(
    (email, lang) => api.post('/api/auth/forgot', { email, lang }),
    [],
  )
  const resetPassword = useCallback(
    async (token, password) => {
      const r = await api.post('/api/auth/reset', { token, password })
      if (r.ok && r.token) {
        setToken(r.token) // a reset (no 2FA) logs you straight in
        await refresh()
      }
      return r
    },
    [refresh],
  )
  const verifyEmailToken = useCallback(
    async (token) => {
      const r = await api.post('/api/auth/verify-email', { token })
      if (r.ok) await refresh()
      return r
    },
    [refresh],
  )
  const resendVerification = useCallback((lang) => api.post('/api/auth/resend-verification', { lang }), [])
  const sendContact = useCallback(
    (email, message, topic) => api.post('/api/contact', { email, message, topic }),
    [],
  )
  // native app: hand an APNs/FCM device token to the server for push
  const registerDevice = useCallback(
    (token, platform) => api.post('/api/push/native-register', { token, platform }),
    [],
  )

  // --- account security + deletion -----------------------------------------
  const setup2fa = useCallback(() => api.post('/api/me/2fa/setup'), [])
  const enable2fa = useCallback(
    async (code) => {
      const r = await api.post('/api/me/2fa/enable', { code })
      if (r.ok) await refresh()
      return r
    },
    [refresh],
  )
  const disable2fa = useCallback(
    async (password) => {
      const r = await api.post('/api/me/2fa/disable', { password })
      if (r.ok) await refresh()
      return r
    },
    [refresh],
  )
  const deleteAccount = useCallback(
    async (password) => {
      const r = await api.post('/api/me/delete', { password })
      if (r.ok) {
        setToken(null)
        await refresh()
      }
      return r
    },
    [refresh],
  )

  // --- mutations (persisted, then re-sync) ---------------------------------
  const mutate = useCallback(
    async (call) => {
      const r = await call()
      if (r.ok) await refresh()
      return r
    },
    [refresh],
  )

  const toggleAttendee = useCallback(
    (battleId) => mutate(() => api.post(`/api/battles/${battleId}/attend`)),
    [mutate],
  )
  const registerProducer = useCallback(
    (battleId) => mutate(() => api.post(`/api/battles/${battleId}/register`, { agreeRules: true })),
    [mutate],
  )
  const disqualifySubmission = useCallback(
    (submissionId) => mutate(() => api.post(`/api/submissions/${submissionId}/disqualify`)),
    [mutate],
  )
  const submitBeat = useCallback(
    (battleId, payload) => mutate(() => api.post(`/api/battles/${battleId}/submissions`, payload)),
    [mutate],
  )
  const castVote = useCallback(
    (battleId, submissionId) =>
      mutate(() => api.post(`/api/battles/${battleId}/vote`, { submissionId })),
    [mutate],
  )
  const predict = useCallback(
    (battleId, submissionId) =>
      mutate(() => api.post(`/api/battles/${battleId}/predict`, { submissionId })),
    [mutate],
  )
  const toggleFollow = useCallback(
    (userId) => {
      const target = getUser(userId)
      // @SMPL stays neutral: it follows nobody, and nobody can unfollow it.
      if (currentUser?.alias === 'SMPL') return Promise.resolve({ ok: false })
      if (target?.alias === 'SMPL' && isFollowing(userId)) return Promise.resolve({ ok: true, following: true })
      return mutate(() => api.post(`/api/users/${userId}/follow`))
    },
    [mutate, getUser, currentUser, isFollowing],
  )
  // --- safety: block / report ---------------------------------------------
  const toggleBlock = useCallback(
    (userId) => mutate(() => api.post(`/api/users/${userId}/block`)),
    [mutate],
  )
  const reportTarget = useCallback(
    (targetType, targetId, reason, context) =>
      api.post('/api/reports', { targetType, targetId, reason, context }),
    [],
  )
  const fetchReports = useCallback(() => api.get('/api/reports'), [])
  const resolveReport = useCallback(
    (id) => api.post(`/api/reports/${id}/resolve`),
    [],
  )
  // --- admin: backups + appointing curators --------------------------------
  const fetchBackups = useCallback(() => api.get('/api/admin/backups'), [])
  const triggerBackup = useCallback(() => api.post('/api/admin/backup'), [])
  const setUserRole = useCallback(
    (userId, role) => mutate(() => api.post(`/api/admin/users/${userId}/role`, { role })),
    [mutate],
  )
  const toggleVerified = useCallback(
    (userId) => mutate(() => api.post(`/api/admin/users/${userId}/verify`)),
    [mutate],
  )
  const createBattle = useCallback(
    (data) => mutate(() => api.post('/api/battles', data)),
    [mutate],
  )
  const updateBattle = useCallback((id, data) => mutate(() => api.patch(`/api/battles/${id}`, data)), [mutate])
  const deleteBattle = useCallback((id) => mutate(() => api.del(`/api/battles/${id}`)), [mutate])
  const advanceStatus = useCallback(
    (battleId) => mutate(() => api.patch(`/api/battles/${battleId}/status`)),
    [mutate],
  )
  const declareWinner = useCallback(
    (battleId, submissionId) =>
      mutate(() => api.post(`/api/battles/${battleId}/winner`, { submissionId })),
    [mutate],
  )
  const approveSubmission = useCallback(
    (submissionId) => mutate(() => api.patch(`/api/submissions/${submissionId}/approve`)),
    [mutate],
  )

  // Curator audio upload (sample / open-verse beat). Returns { ok, url }.
  const uploadAudio = useCallback((file) => api.upload('/api/uploads/audio', file), [])
  // Email the current user a download link to a battle's source (needs SMTP).
  const emailSource = useCallback((battleId, lang) => api.post(`/api/battles/${battleId}/email-source`, { lang }), [])
  // --- comments on battle beats --------------------------------------------
  const fetchComments = useCallback((subId) => api.get(`/api/submissions/${subId}/comments`), [])
  const postComment = useCallback((subId, body) => api.post(`/api/submissions/${subId}/comments`, { body }), [])
  const deleteComment = useCallback((id) => api.del(`/api/comments/${id}`), [])

  // --- profile + social ----------------------------------------------------
  const updateProfile = useCallback((payload) => mutate(() => api.patch('/api/me', payload)), [mutate])
  const updateRole = useCallback(
    (role, dual = false) => mutate(() => api.post('/api/me/role', { role, dual })),
    [mutate],
  )
  const setCuratorCompetes = useCallback(
    (on, agree = false) => mutate(() => api.post('/api/me/curator-competes', { on, agree })),
    [mutate],
  )
  // community sample makers
  const applySampleMaker = useCallback((model, agree) => mutate(() => api.post('/api/me/sample-maker', { model, agree })), [mutate])
  const submitSample = useCallback((payload) => api.post('/api/samples', payload), [])
  const fetchMySamples = useCallback(() => api.get('/api/me/samples'), [])
  const fetchCommunitySamples = useCallback(() => api.get('/api/samples'), [])
  const fetchSampleReview = useCallback(() => api.get('/api/admin/sample-makers'), [])
  const reviewSampleMaker = useCallback((id, status) => api.post(`/api/admin/sample-makers/${id}`, { status }), [])
  const reviewSample = useCallback((id, status) => api.post(`/api/admin/samples/${id}`, { status }), [])
  const exportData = useCallback(() => api.get('/api/me/export'), [])
  const fetchFeed = useCallback(() => api.get('/api/feed'), [])
  const fetchNotifications = useCallback(() => api.get('/api/notifications'), [])

  // --- direct messages -----------------------------------------------------
  const fetchThreads = useCallback(() => api.get('/api/threads'), [])
  const fetchThread = useCallback((alias) => api.get(`/api/threads/${encodeURIComponent(alias)}`), [])
  const sendMessage = useCallback(
    (toAlias, body, opts = {}) =>
      api.post('/api/messages', {
        toAlias,
        body,
        battleId: opts.battleId,
        replyTo: opts.replyTo,
        imageUrl: opts.imageUrl,
        audioUrl: opts.audioUrl,
      }),
    [],
  )
  const reactMessage = useCallback((id, emoji) => api.post(`/api/messages/${id}/react`, { emoji }), [])
  const unsendMessage = useCallback((id) => api.del(`/api/messages/${id}`), [])
  const stampPhoto = useCallback((id, { emoji, x, y }) => api.post(`/api/messages/${id}/stamp`, { emoji, x, y }), [])
  const unstampPhoto = useCallback((id, stampId) => api.del(`/api/messages/${id}/stamp/${stampId}`), [])
  const uploadImage = useCallback((file) => api.upload('/api/uploads/image', file), [])
  const uploadVideo = useCallback((file) => api.upload('/api/uploads/video', file), [])
  const saveWaveformVideo = useCallback((data) => api.post('/api/me/waveform-video', data), [])
  const fetchWaveformVideos = useCallback((userId) => api.get(`/api/users/${userId}/waveform-videos`), [])
  const fetchWaveformVideo = useCallback((id) => api.get(`/api/waveform-videos/${id}`), [])
  const deleteWaveformVideo = useCallback((id) => api.del(`/api/me/waveform-video/${id}`), [])
  // crate — save beats/verses to your profile (mutate so cratedIds refreshes)
  const crateBeat = useCallback((submissionId) => mutate(() => api.post('/api/crate', { submissionId })), [mutate])
  const uncrateBeat = useCallback((submissionId) => mutate(() => api.del(`/api/crate/${submissionId}`)), [mutate])
  const fetchCrate = useCallback((userId) => api.get(`/api/users/${userId}/crate`), [])
  const fetchCrateReach = useCallback(() => api.get('/api/me/crate-reach'), [])
  const isCrated = useCallback((submissionId) => cratedIds.includes(submissionId), [cratedIds])
  // curator battle drafts (managed locally in the dashboard)
  const saveBattleDraft = useCallback((data, id) => api.post('/api/battle-drafts', { data, id }), [])
  const fetchBattleDrafts = useCallback(() => api.get('/api/battle-drafts'), [])
  const deleteBattleDraft = useCallback((id) => api.del(`/api/battle-drafts/${id}`), [])
  const markNotificationsSeen = useCallback(async () => {
    await api.post('/api/notifications/seen')
    await refresh()
  }, [refresh])

  const value = {
    // state
    users,
    battles,
    submissions,
    votes,
    follows,
    myVotes,
    myPredictions,
    currentUser,
    // admin is a superset of curator — `isCurator` means "can run battles +
    // moderate" (curator OR admin); `isAdmin` gates admin-only powers.
    isCurator: currentUser?.role === 'curator' || currentUser?.role === 'admin',
    isAdmin: currentUser?.role === 'admin',
    // house accounts (admin + the official @SMPL) may use the account switcher
    isHouse: currentUser?.role === 'admin' || currentUser?.alias === 'SMPL',
    accountSessions,
    toast,
    dismissToast,
    loading,
    error,
    unread,
    unreadMessages,
    blocked,
    mailConfigured,
    pushConfigured,
    refresh,
    // selectors
    getBattle,
    getUser,
    getUserByAlias,
    battleSubmissions,
    voteCount,
    userVoteInBattle,
    myPrediction,
    rankedSubmissions,
    followerCount,
    isFollowing,
    isBlocked,
    producerStats,
    curatorStats,
    // auth
    login,
    verify2fa,
    signup,
    changePassword,
    magicSend,
    magicConsume,
    finalizeSignup,
    logout,
    requestPasswordReset,
    resetPassword,
    verifyEmailToken,
    resendVerification,
    sendContact,
    registerDevice,
    setup2fa,
    enable2fa,
    disable2fa,
    deleteAccount,
    // mutations
    toggleAttendee,
    registerProducer,
    disqualifySubmission,
    submitBeat,
    castVote,
    toggleFollow,
    toggleBlock,
    reportTarget,
    fetchReports,
    resolveReport,
    fetchBackups,
    triggerBackup,
    setUserRole,
    toggleVerified,
    fetchHouseAccounts,
    switchAccount,
    removeSession,
    createBattle,
    updateBattle,
    deleteBattle,
    advanceStatus,
    declareWinner,
    approveSubmission,
    uploadAudio,
    uploadVideo,
    saveWaveformVideo,
    fetchWaveformVideos,
    fetchWaveformVideo,
    deleteWaveformVideo,
    cratedIds,
    isCrated,
    crateBeat,
    uncrateBeat,
    fetchCrate,
    fetchCrateReach,
    saveBattleDraft,
    fetchBattleDrafts,
    deleteBattleDraft,
    emailSource,
    fetchComments,
    postComment,
    deleteComment,
    updateProfile,
    updateRole,
    setCuratorCompetes,
    applySampleMaker,
    submitSample,
    fetchMySamples,
    fetchCommunitySamples,
    fetchSampleReview,
    reviewSampleMaker,
    reviewSample,
    exportData,
    fetchFeed,
    fetchNotifications,
    markNotificationsSeen,
    fetchThreads,
    fetchThread,
    sendMessage,
    reactMessage,
    unsendMessage,
    stampPhoto,
    unstampPhoto,
    uploadImage,
  }

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

// ===========================================================================
// PLAYBACK CONTEXT — unchanged simulated transport (one track at a time).
// ===========================================================================

const PlayCtx = createContext(null)
export const usePlayback = () => useContext(PlayCtx)

export function PlaybackProvider({ children }) {
  const [track, setTrack] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [audioDur, setAudioDur] = useState(0)
  const elapsedRef = useRef(0)
  const trackRef = useRef(null)
  const audioRef = useRef(null)
  const seekRef = useRef(null) // pending seek fraction, applied once metadata loads

  const real = !!track?.src

  const play = () => {
    const a = audioRef.current
    if (!a) return
    const p = a.play()
    if (p && p.catch) p.catch(() => {})
  }
  const loadReal = (src, frac = 0) => {
    const a = audioRef.current
    if (!a) return
    setAudioDur(0)
    seekRef.current = frac > 0 ? frac : null
    a.src = mediaUrl(src)
    a.load()
    play()
  }

  // Wire the shared <audio> element once — real tracks drive elapsed/duration.
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onTime = () => {
      elapsedRef.current = a.currentTime
      setElapsed(a.currentTime)
    }
    const onMeta = () => {
      setAudioDur(a.duration || 0)
      if (seekRef.current != null) {
        a.currentTime = seekRef.current * (a.duration || 0)
        seekRef.current = null
      }
    }
    const onEnded = () => {
      setPlaying(false)
      elapsedRef.current = 0
      setElapsed(0)
    }
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('ended', onEnded)
    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('ended', onEnded)
    }
  }, [])

  // Simulated transport — only for tracks WITHOUT real audio.
  useEffect(() => {
    if (!playing || !track || real) return
    let raf
    let last = null
    const loop = (ts) => {
      if (last == null) last = ts
      const dt = (ts - last) / 1000
      last = ts
      let n = elapsedRef.current + dt
      const d = track.duration || 1
      if (n >= d) n = n % d
      elapsedRef.current = n
      setElapsed(n)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, track, real])

  // Effective duration of the current track (real audio overrides the estimate).
  const duration = real ? audioDur || track?.duration || 0 : track?.duration || 0

  const toggle = useCallback((meta) => {
    const cur = trackRef.current
    const a = audioRef.current
    if (cur && cur.id === meta.id) {
      setPlaying((p) => {
        const np = !p
        if (meta.src && a) np ? play() : a.pause()
        return np
      })
      return
    }
    elapsedRef.current = 0
    setElapsed(0)
    setAudioDur(0)
    trackRef.current = meta
    setTrack(meta)
    setPlaying(true)
    if (meta.src) loadReal(meta.src, 0)
    else if (a) {
      a.pause()
      a.removeAttribute('src')
    }
  }, [])

  const playAt = useCallback((meta, frac) => {
    const f = Math.max(0, Math.min(1, frac))
    const cur = trackRef.current
    const a = audioRef.current
    const same = cur && cur.id === meta.id
    trackRef.current = meta
    setTrack(meta)
    setPlaying(true)
    if (meta.src) {
      if (same && a && a.duration) {
        a.currentTime = f * a.duration
        play()
      } else {
        loadReal(meta.src, f)
      }
      return
    }
    const n = f * (meta.duration || 0)
    elapsedRef.current = n
    setElapsed(n)
  }, [])

  const stop = useCallback(() => {
    const a = audioRef.current
    if (a) {
      a.pause()
      a.removeAttribute('src')
    }
    setPlaying(false)
    setTrack(null)
    trackRef.current = null
    setAudioDur(0)
    elapsedRef.current = 0
    setElapsed(0)
  }, [])

  const value = { track, playing, elapsed, duration, toggle, playAt, stop }
  return (
    <PlayCtx.Provider value={value}>
      <audio ref={audioRef} preload="metadata" />
      {children}
    </PlayCtx.Provider>
  )
}

export function Providers({ children }) {
  return (
    <AppProvider>
      <PlaybackProvider>{children}</PlaybackProvider>
    </AppProvider>
  )
}
