// Merge of every namespace into one flat { en, nl } lookup. Each screen group
// owns its own ns/<name>.js so translations stay modular + conflict-free.
import { common } from './ns/common.js'
import { chrome } from './ns/chrome.js'
import { landing } from './ns/landing.js'
import { battles } from './ns/battles.js'
import { battleDetail } from './ns/battleDetail.js'
import { auth } from './ns/auth.js'
import { profile } from './ns/profile.js'
import { dashboard } from './ns/dashboard.js'
import { social } from './ns/social.js'
import { extra } from './ns/extra.js'
import { messages } from './ns/messages.js'
import { share } from './ns/share.js'
import { tour } from './ns/tour.js'
import { game } from './ns/game.js'
import { crate } from './ns/crate.js'
import { journal } from './ns/journal.js'

const parts = [common, chrome, landing, battles, battleDetail, auth, profile, dashboard, social, extra, messages, share, tour, game, crate, journal]

export const strings = {
  en: Object.assign({}, ...parts.map((p) => p.en)),
  nl: Object.assign({}, ...parts.map((p) => p.nl)),
}
