import { Capacitor } from '@capacitor/core'

let wired = false

// Register the native device for push (iOS APNs / Android FCM) and hand the
// token to the server. Only runs inside the Capacitor app; the plugin is loaded
// lazily so the web bundle never pulls it in.
export async function initNativePush(registerFn, navigate) {
  try {
    if (!Capacitor?.isNativePlatform?.()) return
  } catch {
    return
  }

  let PushNotifications
  try {
    ;({ PushNotifications } = await import('@capacitor/push-notifications'))
  } catch {
    return
  }

  if (!wired) {
    wired = true
    // token issued → store it server-side against the logged-in user
    PushNotifications.addListener('registration', (t) => {
      try {
        registerFn(t.value, Capacitor.getPlatform())
      } catch {
        /* ignore */
      }
    })
    // tapping a notification deep-links into the app
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const url = action?.notification?.data?.url
      if (url) {
        try {
          navigate(url)
        } catch {
          /* ignore */
        }
      }
    })
  }

  try {
    let { receive } = await PushNotifications.checkPermissions()
    if (receive === 'prompt' || receive === 'prompt-with-rationale') {
      receive = (await PushNotifications.requestPermissions()).receive
    }
    if (receive === 'granted') await PushNotifications.register()
  } catch {
    /* permission flow failed — ignore */
  }
}
