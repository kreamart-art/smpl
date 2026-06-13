import { Capacitor } from '@capacitor/core'

// True only inside the Capacitor native shell (iOS/Android), false on the web.
export const isNative = (() => {
  try {
    return Capacitor?.isNativePlatform?.() ?? false
  } catch {
    return false
  }
})()

// One-time native setup, run from main on boot. Plugins are imported lazily so
// the web bundle never loads them. Every step is best-effort.
export async function initNative() {
  if (!isNative) return

  try {
    const { ScreenOrientation } = await import('@capacitor/screen-orientation')
    await ScreenOrientation.lock({ orientation: 'portrait' })
  } catch {
    /* portrait not lockable — ignore */
  }

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    // Style.Dark = light icons (for our black chrome); Android also needs the bg.
    await StatusBar.setStyle({ style: Style.Dark })
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#000000' })
    }
  } catch {
    /* ignore */
  }

  try {
    const { App } = await import('@capacitor/app')
    // Android hardware back: go back in history, or leave the app at the root.
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back()
      else App.exitApp()
    })
  } catch {
    /* ignore */
  }

  // Reveal the app once it has painted.
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch {
    /* ignore */
  }
}
