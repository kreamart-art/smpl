# SMPL — native app (Capacitor)

The web app is wrapped with [Capacitor](https://capacitorjs.com) into native
iOS + Android apps. The native shell bundles the built web assets locally and
talks to the **live backend at `https://smpl.artnomad.nl`** (no server.url — it's
not a thin remote webview). App id: **`nl.artnomad.smpl`**, name **SMPL**.

What's already wired in this repo:

- `capacitor.config.json` — app id/name, black chrome, splash config.
- `src/lib/native.js` — on boot (native only): **locks portrait**, sets the
  status bar, hides the splash, handles the Android back button.
- `src/api.js` — `API_BASE` points to `https://smpl.artnomad.nl` when native;
  `mediaUrl()` makes uploaded audio/images/sample links absolute.
- `assets/` — `icon-only.png` (1024) + `splash[-dark].png` (2732) sources for
  icon/splash generation. *Replace `assets/icon-only.png` with a crisp 1024px+
  artwork for store quality (the current one is upscaled from 512px).*

## One-time setup on a Mac

Install the native toolchains (not present in CI):

```bash
xcode-select --install            # Xcode Command Line Tools
# + install Xcode from the App Store, open it once to accept the license
sudo gem install cocoapods        # iOS dependency manager
# Android: install Android Studio (bundles the SDK + JDK)
```

Add the native projects (creates `ios/` and `android/`):

```bash
npm run build
npx cap add ios
npx cap add android
npm run cap:assets                # generates app icons + splash screens
```

## Build & run

```bash
npm run cap:ios       # build web → sync → open Xcode
npm run cap:android   # build web → sync → open Android Studio
```

In **Xcode**: pick your Team under *Signing & Capabilities*, confirm the bundle
id `nl.artnomad.smpl`, then Run on a simulator/device. Archive → *Distribute App*
→ TestFlight for beta. Set *General → Deployment Info → iPhone Orientation* to
**Portrait only**.

In **Android Studio**: let Gradle sync, then Run. Build → *Generate Signed
Bundle* for a Play Store `.aab`.

Re-run `npm run cap:sync` after any web change to copy the new `dist/` in.

## Required native permissions (add before submitting)

- **iOS** `ios/App/App/Info.plist`:
  - `NSMicrophoneUsageDescription` — "SMPL uses the mic to record voice clips in DMs."
  - `NSPhotoLibraryUsageDescription` — "SMPL lets you send photos in DMs."
- **Android** `android/app/src/main/AndroidManifest.xml`:
  - `<uses-permission android:name="android.permission.RECORD_AUDIO" />`
  - `android:screenOrientation="portrait"` on the main `<activity>` (belt-and-braces with the runtime lock).

## Next (step 2): native push

Web push is replaced by native push on device. Add `@capacitor/push-notifications`
wiring (already installed), register for APNs (iOS) / FCM (Android), and POST the
device token to a new server endpoint so the backend can notify via APNs/FCM.

See [[smpl_deploy]] for backend/deploy details.
