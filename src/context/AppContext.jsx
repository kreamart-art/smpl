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
import { api, setToken } from '../api.js'

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
  const [currentUser, setCurrentUser] = useState(null)
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const applyBootstrap = useCallback((d) => {
    setUsers(d.users || [])
    setBattles(d.battles || [])
    setSubmissions(d.submissions || [])
    setVotes(d.votes || [])
    setFollows(d.follows || [])
    setMyVotes(d.myVotes || {})
    setCurrentUser(d.me || null)
    setUnread(d.unread || 0)
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
  const followerCount = useCallback(
    (userId) => follows.filter((f) => f.followeeId === userId).length,
    [follows],
  )
  const isFollowing = useCallback(
    (userId) =>
      !!currentUser && follows.some((f) => f.followerId === currentUser.id && f.followeeId === userId),
    [follows, currentUser],
  )

  const rankedSubmissions = useCallback(
    (battleId) =>
      battleSubmissions(battleId)
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
    async (email, password) => {
      const r = await api.post('/api/auth/login', { email, password })
      if (r.ok) {
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

  const logout = useCallback(async () => {
    setToken(null)
    await refresh()
  }, [refresh])

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
    (battleId) => mutate(() => api.post(`/api/battles/${battleId}/register`)),
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
  const toggleFollow = useCallback(
    (userId) => mutate(() => api.post(`/api/users/${userId}/follow`)),
    [mutate],
  )
  const createBattle = useCallback(
    (data) => mutate(() => api.post('/api/battles', data)),
    [mutate],
  )
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

  // --- profile + social ----------------------------------------------------
  const updateProfile = useCallback((payload) => mutate(() => api.patch('/api/me', payload)), [mutate])
  const fetchFeed = useCallback(() => api.get('/api/feed'), [])
  const fetchNotifications = useCallback(() => api.get('/api/notifications'), [])
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
    currentUser,
    isCurator: currentUser?.role === 'curator',
    loading,
    error,
    unread,
    refresh,
    // selectors
    getBattle,
    getUser,
    getUserByAlias,
    battleSubmissions,
    voteCount,
    userVoteInBattle,
    rankedSubmissions,
    followerCount,
    isFollowing,
    producerStats,
    curatorStats,
    // auth
    login,
    signup,
    logout,
    // mutations
    toggleAttendee,
    registerProducer,
    submitBeat,
    castVote,
    toggleFollow,
    createBattle,
    advanceStatus,
    declareWinner,
    approveSubmission,
    updateProfile,
    fetchFeed,
    fetchNotifications,
    markNotificationsSeen,
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
  const elapsedRef = useRef(0)

  useEffect(() => {
    if (!playing || !track) return
    let raf
    let last = null
    const loop = (ts) => {
      if (last == null) last = ts
      const dt = (ts - last) / 1000
      last = ts
      let n = elapsedRef.current + dt
      if (n >= track.duration) n = n % track.duration
      elapsedRef.current = n
      setElapsed(n)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, track])

  const toggle = useCallback((meta) => {
    setTrack((cur) => {
      const same = cur && cur.id === meta.id
      if (same) {
        setPlaying((p) => !p)
        return cur
      }
      elapsedRef.current = 0
      setElapsed(0)
      setPlaying(true)
      return meta
    })
  }, [])

  const playAt = useCallback((meta, frac) => {
    const n = Math.max(0, Math.min(1, frac)) * meta.duration
    elapsedRef.current = n
    setElapsed(n)
    setTrack(meta)
    setPlaying(true)
  }, [])

  const stop = useCallback(() => {
    setPlaying(false)
    setTrack(null)
    elapsedRef.current = 0
    setElapsed(0)
  }, [])

  const value = { track, playing, elapsed, toggle, playAt, stop }
  return <PlayCtx.Provider value={value}>{children}</PlayCtx.Provider>
}

export function Providers({ children }) {
  return (
    <AppProvider>
      <PlaybackProvider>{children}</PlaybackProvider>
    </AppProvider>
  )
}
