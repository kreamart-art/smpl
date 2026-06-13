# SMPL — App Store launch prep

Everything you need to fill in App Store Connect (Apple) and the Play Console
(Google). The legal pages are live in the app: `/privacy`, `/terms`,
`/guidelines`, `/copyright`. Have a lawyer skim the legal copy before launch.

> ⚠️ A lawyer should review the Terms + Privacy for your exact entity. The operator
> is set to **ART NOMAD** + `info@artnomad.nl` in `src/pages/Legal.jsx` — change if needed.

## Listing copy

- **Name:** SMPL
- **Subtitle (≤30):** Beat & verse battles
- **Promo text:** Same sample. Different soul.
- **Keywords:** producer,beatmaker,beats,verse,battle,rap,hip hop,sample,freestyle,vote,instrumental,music
- **Description:**
  > One sample, many takes. SMPL is where producers and artists battle on the
  > same source — flip the sample your way, drop your beat or verse, and let the
  > crowd vote. Follow makers, DM them, and climb the board. Same sample.
  > Different soul.
- **Support URL:** https://smpl.artnomad.nl/contact
- **Marketing/Privacy URL:** https://smpl.artnomad.nl/privacy

## App privacy (Apple) / Data safety (Google)

Data collected, **linked to the user**, used for **App Functionality only**
(NOT for tracking — there are no third-party ad/analytics SDKs → "Data not used
to track you"):

| Data | Apple category | Notes |
|---|---|---|
| Email | Contact Info → Email | account / login |
| Legal name, phone (optional) | Contact Info → Name / Phone | private, profile only |
| Date of birth | Sensitive Info | age check (16+) |
| Country/city (optional, self-typed) | Contact Info → Physical Address (coarse) | NOT device location |
| Audio, photos, comments, messages, bio | User Content | the stuff people post |
| User ID, push device token | Identifiers | account + push routing |
| IP address, server logs | Diagnostics / Identifiers | security + anti-spam, kept briefly |

**No precise location, no contacts, no health, no ad identifiers, no tracking.**

## Age rating

- Has **user-generated content + direct messages** → rate **17+ (Apple)** /
  **Mature/Teen (Google IARC)** unless you can argue strong moderation lowers it.
- Answer the IARC questionnaire honestly: UGC = yes, user interaction/DMs = yes,
  no gambling, no explicit content by policy (moderated).

## Review prep checklist

- [ ] **Demo account** for the reviewer (Apple requires working login creds) —
      make a normal account + put the email/password in *App Review Information*.
- [ ] **Account deletion** in-app: Settings → Delete account ✅ (point the
      reviewer to it).
- [ ] **Moderation**: report + block in-app ✅, `/guidelines` + `/copyright`
      published ✅, commit to acting on reports within 24h.
- [ ] **Not a thin webview**: native push + portrait lock + bundled assets ✅.
- [ ] **Permissions usage strings** present (mic/photos) — see `CAPACITOR.md`.
- [ ] **Push**: set the APNs/FCM env (see `CAPACITOR.md`) so notifications work.
- [ ] **Sign in with Apple**: not required (email/password only, no social login).
- [ ] **Payments**: none in Phase 1 (paid curation is Phase 2 → plan for IAP then).

## Screenshots (capture from a device/simulator)

Required: iPhone **6.7"** (1290×2796) and **6.5"** (1242×2688); iPad 12.9" if you
ship iPad; Android phone (any). Suggested shots:

1. Battles list (the board) 2. A battle in voting 3. A profile 4. The winner
reveal 5. DMs (rich messages). Keep the black/mono aesthetic; no status-bar clutter.

## Accounts you create (not me)

- **Apple Developer Program** — $99/yr (developer.apple.com).
- **Google Play Developer** — $25 one-time (play.google.com/console).
- **Firebase project** (Android push) + **APNs key** (iOS push) — see `CAPACITOR.md`.

See [[smpl_native_app]] and [[smpl_deploy]].
