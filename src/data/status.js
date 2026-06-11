export const STATUS = {
  ANNOUNCED: 'ANNOUNCED',
  OPEN_FOR_SIGNUP: 'OPEN_FOR_SIGNUP',
  SUBMISSION_PHASE: 'SUBMISSION_PHASE',
  VOTING_PHASE: 'VOTING_PHASE',
  WINNER_DECLARED: 'WINNER_DECLARED',
}

// Pipeline order — the curator pushes a battle forward through these.
export const STATUS_ORDER = [
  STATUS.ANNOUNCED,
  STATUS.OPEN_FOR_SIGNUP,
  STATUS.SUBMISSION_PHASE,
  STATUS.VOTING_PHASE,
  STATUS.WINNER_DECLARED,
]

export const STATUS_LABEL = {
  ANNOUNCED: 'ANNOUNCED',
  OPEN_FOR_SIGNUP: 'OPEN FOR SIGNUP',
  SUBMISSION_PHASE: 'SUBMISSION PHASE',
  VOTING_PHASE: 'VOTING PHASE',
  WINNER_DECLARED: 'WINNER DECLARED',
}

export const STATUS_INDEX = {
  ANNOUNCED: 1,
  OPEN_FOR_SIGNUP: 2,
  SUBMISSION_PHASE: 3,
  VOTING_PHASE: 4,
  WINNER_DECLARED: 5,
}

// Maps each status into one of the three filter buckets on /battles.
export const STATUS_GROUP = {
  ANNOUNCED: 'upcoming',
  OPEN_FOR_SIGNUP: 'upcoming',
  SUBMISSION_PHASE: 'active',
  VOTING_PHASE: 'active',
  WINNER_DECLARED: 'past',
}

export const GROUP_LABEL = {
  active: 'ACTIVE',
  upcoming: 'UPCOMING',
  past: 'PAST',
}

export function nextStatus(status) {
  const i = STATUS_ORDER.indexOf(status)
  if (i < 0 || i === STATUS_ORDER.length - 1) return status
  return STATUS_ORDER[i + 1]
}

// Which deadline matters for the countdown, given the phase.
export function countdownTarget(battle) {
  switch (battle.status) {
    case STATUS.ANNOUNCED:
      return { ts: battle.signupStart, label: 'SIGNUP OPENS' }
    case STATUS.OPEN_FOR_SIGNUP:
      return { ts: battle.signupEnd, label: 'SIGNUP CLOSES' }
    case STATUS.SUBMISSION_PHASE:
      return { ts: battle.submitEnd, label: 'SUBMISSIONS CLOSE' }
    case STATUS.VOTING_PHASE:
      return { ts: battle.voteEnd, label: 'VOTING CLOSES' }
    case STATUS.WINNER_DECLARED:
    default:
      return { ts: null, label: 'CLOSED' }
  }
}
