// While the new layout is in preview the server serves two builds and tells
// each session which one it should run (server/layout.js). This is the current
// layout everyone sees; the build in src/ says 'new'. On a mismatch the server
// has already set or cleared the layout cookie, so one reload lands in the
// right build.
import { getToken } from '../api.js'

export const LAYOUT = 'legacy'
const KEY = 'smpl_layout_switch'
// a switch right after logging in: the login form has done its job
const AUTH_PAGE = /^\/(login|signup|auth|forgot|reset|verify)(\/|$)/

// true when the page is reloading into the other build
export function followLayout(want) {
  if (!import.meta.env.PROD || !want) return false
  try {
    if (want === LAYOUT) {
      sessionStorage.removeItem(KEY)
      return false
    }
    // a reload a moment ago didn't take (cookies blocked?): stay, never loop
    if (Date.now() - (Number(sessionStorage.getItem(KEY)) || 0) < 60_000) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    return false
  }
  if (getToken() && AUTH_PAGE.test(window.location.pathname)) window.location.replace('/')
  else window.location.reload()
  return true
}
