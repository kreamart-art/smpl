import nodemailer from 'nodemailer'

// SMTP is configured purely through env vars (set them in Coolify). With nothing
// set, the app still runs — emails are logged and skipped instead of sent, so
// password reset / verification degrade gracefully until SMTP is wired up.
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE } = process.env

// Note: Hetzner blocks outbound 25 + 465 — use 587 (STARTTLS). Default to it.
const PORT = Number(SMTP_PORT) || 587
const FROM = SMTP_FROM || (SMTP_USER ? `SMPL <${SMTP_USER}>` : 'SMPL <no-reply@smpl.local>')

export const mailConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS)

let transport = null
if (mailConfigured) {
  const secure = SMTP_SECURE ? SMTP_SECURE === 'true' : PORT === 465
  transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: PORT,
    secure,
    requireTLS: !secure, // force STARTTLS on 587 — never auth in plaintext
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
}

// Send an email if SMTP is configured; otherwise log + report it was skipped.
export async function sendEmail({ to, subject, text, html, replyTo }) {
  if (!transport) {
    console.warn(`[email] SMTP not configured — skipped "${subject}" → ${to}`)
    return { ok: false, skipped: true }
  }
  try {
    await transport.sendMail({ from: FROM, to, subject, text, html, replyTo })
    return { ok: true }
  } catch (e) {
    console.error('[email] send failed:', e.message)
    return { ok: false, error: e.message }
  }
}

// ----- templates -------------------------------------------------------------
function shell(bodyHtml) {
  return `<!doctype html><html lang="en"><body style="margin:0;background:#0a0a0a;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#e7e7e7;padding:32px 16px">
  <div style="max-width:480px;margin:0 auto;border:1px solid #2a2a2a;background:#111">
    <div style="padding:28px 28px 4px"><div style="font-family:Arial,Helvetica,sans-serif;font-weight:800;letter-spacing:6px;font-size:20px;color:#ffffff">SMPL</div></div>
    <div style="padding:18px 28px 28px;font-size:14px;line-height:1.6">${bodyHtml}</div>
    <div style="padding:16px 28px;border-top:1px solid #2a2a2a;font-size:11px;color:#777;letter-spacing:0.5px">Same sample. Different soul. · usesmpl.com</div>
  </div>
</body></html>`
}

function button(href, label) {
  return `<a href="${href}" style="display:inline-block;background:#ffffff;color:#000000;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:13px 26px">${label}</a>`
}

const esc = (s) => String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c])

export function resetEmail(link, lang = 'en') {
  if (lang === 'nl') {
    return {
      subject: 'Stel je SMPL-wachtwoord opnieuw in',
      text: `Stel je SMPL-wachtwoord opnieuw in via deze link (1 uur geldig):\n${link}\n\nNiet aangevraagd? Dan kun je deze mail negeren.`,
      html: shell(
        `<p style="margin:0 0 16px">Je hebt gevraagd om je wachtwoord opnieuw in te stellen. Klik hieronder — de link is <strong>1 uur</strong> geldig.</p>
         <p style="margin:0 0 22px">${button(link, 'Wachtwoord resetten')}</p>
         <p style="margin:0 0 8px;color:#999">Werkt de knop niet? Plak deze link in je browser:</p>
         <p style="margin:0 0 18px;word-break:break-all;color:#7aa7ff;font-size:12px">${link}</p>
         <p style="margin:0;color:#777">Heb je dit niet aangevraagd? Negeer deze mail dan — je wachtwoord blijft ongewijzigd.</p>`,
      ),
    }
  }
  return {
    subject: 'Reset your SMPL password',
    text: `Reset your SMPL password using this link (valid for 1 hour):\n${link}\n\nDidn’t request this? You can ignore this email.`,
    html: shell(
      `<p style="margin:0 0 16px">You asked to reset your password. Tap below — the link is valid for <strong>1 hour</strong>.</p>
       <p style="margin:0 0 22px">${button(link, 'Reset password')}</p>
       <p style="margin:0 0 8px;color:#999">Button not working? Paste this link into your browser:</p>
       <p style="margin:0 0 18px;word-break:break-all;color:#7aa7ff;font-size:12px">${link}</p>
       <p style="margin:0;color:#777">Didn’t request this? Just ignore this email — your password stays the same.</p>`,
    ),
  }
}

export function sourceEmail(link, battle, lang = 'en') {
  const title = esc(battle.title || 'SMPL battle')
  const what = battle.kind === 'VERSES' ? (lang === 'nl' ? 'beat' : 'beat') : (lang === 'nl' ? 'sample' : 'sample')
  if (lang === 'nl') {
    return {
      subject: `Je download voor "${battle.title || 'SMPL battle'}"`,
      text: `Hier is je ${what} voor de battle "${battle.title}":\n${link}`,
      html: shell(
        `<p style="margin:0 0 16px">Hier is je ${what} voor de battle <strong>${title}</strong> — open ’m op je computer en ga aan de slag.</p>
         <p style="margin:0 0 22px">${button(link, 'Download')}</p>
         <p style="margin:0;word-break:break-all;color:#7aa7ff;font-size:12px">${link}</p>`,
      ),
    }
  }
  return {
    subject: `Your download for "${battle.title || 'SMPL battle'}"`,
    text: `Here is your ${what} for the battle "${battle.title}":\n${link}`,
    html: shell(
      `<p style="margin:0 0 16px">Here is your ${what} for the battle <strong>${title}</strong> — open it on your computer and get to work.</p>
       <p style="margin:0 0 22px">${button(link, 'Download')}</p>
       <p style="margin:0;word-break:break-all;color:#7aa7ff;font-size:12px">${link}</p>`,
    ),
  }
}

export function verifyEmail(link, lang = 'en') {
  if (lang === 'nl') {
    return {
      subject: 'Bevestig je e-mailadres voor SMPL',
      text: `Welkom bij SMPL. Bevestig je e-mailadres via deze link:\n${link}`,
      html: shell(
        `<p style="margin:0 0 16px">Welkom bij SMPL. Bevestig je e-mailadres zodat we zeker weten dat jij het bent.</p>
         <p style="margin:0 0 22px">${button(link, 'E-mail bevestigen')}</p>
         <p style="margin:0 0 8px;color:#999">Werkt de knop niet? Plak deze link in je browser:</p>
         <p style="margin:0;word-break:break-all;color:#7aa7ff;font-size:12px">${link}</p>`,
      ),
    }
  }
  return {
    subject: 'Confirm your email for SMPL',
    text: `Welcome to SMPL. Confirm your email using this link:\n${link}`,
    html: shell(
      `<p style="margin:0 0 16px">Welcome to SMPL. Confirm your email so we know it’s really you.</p>
       <p style="margin:0 0 22px">${button(link, 'Confirm email')}</p>
       <p style="margin:0 0 8px;color:#999">Button not working? Paste this link into your browser:</p>
       <p style="margin:0;word-break:break-all;color:#7aa7ff;font-size:12px">${link}</p>`,
    ),
  }
}
