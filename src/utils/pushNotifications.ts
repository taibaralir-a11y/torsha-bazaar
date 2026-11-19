import {
  doc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { getMessaging, getToken, onMessage, deleteToken, isSupported } from 'firebase/messaging';
import { app, db, safeSetDoc } from '../firebase';
import {
  NotificationChannelMode,
  NotificationTokenRecord,
  PortalMode,
  RideBooking,
  RideNotificationLog,
  VehicleType
} from '../types';

export const RIDE_NOTIFICATION_CHANNEL_ID = 'torsha_rides_urgent_v1';
const LOCAL_TOKEN_DOC_ID_KEY = 'tb_notification_token_doc_id';
const notifiedDedupSet = new Set<string>();

export function detectNotificationPlatform(): 'android_pwa' | 'web' | 'ios_pwa' {
  if (typeof navigator === 'undefined') return 'web';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android')) return 'android_pwa';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'ios_pwa';
  return 'web';
}

export function getBrowserNotificationPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export function isFcmVapidConfigured(): boolean {
  const key = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_FIREBASE_VAPID_KEY;
  return Boolean(key && key.trim().length > 10);
}

export function buildRideDeepLinkUrl(params: {
  portal: 'driver' | 'admin' | 'customer';
  rideId: string;
}): string {
  const sp = new URLSearchParams();
  sp.set('portal', params.portal);
  sp.set('rideId', params.rideId);
  return `/?${sp.toString()}`;
}

export function parseRideDeepLinkFromUrl(search: string = typeof window !== 'undefined' ? window.location.search : ''): {
  portal?: 'driver' | 'admin' | 'customer';
  rideId?: string;
} {
  try {
    const sp = new URLSearchParams(search);
    const portalRaw = sp.get('portal');
    const rideId = sp.get('rideId') || undefined;
    const portal =
      portalRaw === 'driver' || portalRaw === 'admin' || portalRaw === 'customer'
        ? portalRaw
        : undefined;
    return { portal, rideId };
  } catch {
    return {};
  }
}

async function ensureActiveServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return undefined;
  try {
    let reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      reg = await navigator.serviceWorker
        .register('/firebase-messaging-sw.js', { scope: '/' })
        .catch(() => undefined);
    }
    const readyPromise = navigator.serviceWorker.ready.catch(() => reg);
    const timeoutPromise = new Promise<ServiceWorkerRegistration | undefined>((resolve) =>
      window.setTimeout(() => resolve(reg), 2500)
    );
    return await Promise.race([readyPromise, timeoutPromise]);
  } catch {
    return undefined;
  }
}

export async function requestAndRegisterPushNotification(params: {
  uid: string;
  role: PortalMode;
  entityId?: string;
  vehicleType?: VehicleType;
  locality?: string;
  requestPermissionIfDefault?: boolean;
}): Promise<{
  permission: 'granted' | 'denied' | 'default' | 'unsupported';
  fcmToken: string | null;
  channelMode: NotificationChannelMode;
  reason?: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      permission: 'unsupported',
      fcmToken: null,
      channelMode: 'in_app',
      reason: 'Browser Notifications API not supported on this device.'
    };
  }

  let permission: NotificationPermission = Notification.permission;
  if (permission === 'default' && params.requestPermissionIfDefault !== false) {
    permission = await Notification.requestPermission();
  }

  let fcmToken: string | null = null;
  let channelMode: NotificationChannelMode = permission === 'granted' ? 'pwa_local' : 'in_app';
  let reason: string | undefined;

  if (permission === 'granted') {
    const vapidKey = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      ?.VITE_FIREBASE_VAPID_KEY;
    try {
      const supported = await isSupported().catch(() => false);
      if (supported && vapidKey && vapidKey.trim().length > 10) {
        const messaging = getMessaging(app);
        const swReg = await ensureActiveServiceWorkerRegistration();
        const token = await getToken(messaging, {
          vapidKey: vapidKey.trim(),
          ...(swReg ? { serviceWorkerRegistration: swReg } : {})
        });
        if (token) {
          fcmToken = token;
          channelMode = 'fcm';
        }
      } else if (!vapidKey) {
        reason = 'FCM VAPID key not configured; PWA Service Worker local alerts enabled.';
      }
    } catch (err) {
      reason = (err as Error)?.message || 'FCM token registration deferred; PWA local alerts active.';
    }
  }

  await upsertNotificationTokenRecord({
    uid: params.uid,
    role: params.role,
    entityId: params.entityId,
    vehicleType: params.vehicleType,
    locality: params.locality,
    token: fcmToken || `pwa-${params.role}-${params.uid.slice(0, 12)}`,
    fcmEnabled: Boolean(fcmToken),
    permissionStatus: permission
  });

  return { permission, fcmToken, channelMode, reason };
}

export async function upsertNotificationTokenRecord(params: {
  uid: string;
  role: PortalMode;
  entityId?: string;
  vehicleType?: VehicleType;
  locality?: string;
  token: string;
  fcmEnabled: boolean;
  permissionStatus: 'granted' | 'denied' | 'default' | 'unsupported';
}) {
  if (!params.uid) return;
  const nowIso = new Date().toISOString();
  const docId = `nt-${params.uid}-${params.role}`;
  const record: NotificationTokenRecord = {
    id: docId,
    uid: params.uid,
    role: params.role,
    ...(params.entityId ? { entityId: params.entityId } : {}),
    ...(params.vehicleType ? { vehicleType: params.vehicleType } : {}),
    ...(params.locality ? { locality: params.locality } : {}),
    token: params.token,
    fcmEnabled: params.fcmEnabled,
    permissionStatus: params.permissionStatus,
    platform: detectNotificationPlatform(),
    channelId: RIDE_NOTIFICATION_CHANNEL_ID,
    active: params.permissionStatus === 'granted',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 180) : undefined,
    createdAt: nowIso,
    updatedAt: nowIso
  };
  try {
    localStorage.setItem(LOCAL_TOKEN_DOC_ID_KEY, docId);
  } catch {}
  await safeSetDoc(doc(db, 'notificationTokens', docId), record, { merge: true }).catch((err) => {
    console.warn('Notification token sync notice:', (err as Error)?.message);
  });
}

export async function deactivateNotificationTokensForUser(uid: string | null | undefined) {
  if (!uid) return;
  try {
    const q = query(collection(db, 'notificationTokens'), where('uid', '==', uid));
    const snap = await getDocs(q);
    await Promise.all(
      snap.docs.map((d) =>
        updateDoc(d.ref, { active: false, updatedAt: new Date().toISOString() }).catch(() =>
          deleteDoc(d.ref).catch(() => {})
        )
      )
    );
  } catch (err) {
    console.warn('Token deactivation notice:', (err as Error)?.message);
  }

  try {
    const storedId = localStorage.getItem(LOCAL_TOKEN_DOC_ID_KEY);
    if (storedId) {
      localStorage.removeItem(LOCAL_TOKEN_DOC_ID_KEY);
    }
  } catch {}

  try {
    const supported = await isSupported().catch(() => false);
    if (supported && isFcmVapidConfigured()) {
      const messaging = getMessaging(app);
      await deleteToken(messaging).catch(() => {});
    }
  } catch {}
}

export function attachForegroundFcmListener(
  onPayload: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void
): () => void {
  if (typeof window === 'undefined' || !isFcmVapidConfigured()) return () => {};
  let unsub: (() => void) | undefined;
  let cancelled = false;

  isSupported()
    .then((ok) => {
      if (!ok || cancelled) return;
      const messaging = getMessaging(app);
      unsub = onMessage(messaging, (payload) => {
        onPayload({
          title: payload.notification?.title || payload.data?.title,
          body: payload.notification?.body || payload.data?.body,
          data: payload.data
        });
      });
    })
    .catch(() => {});

  return () => {
    cancelled = true;
    if (unsub) unsub();
  };
}

/**
 * Displays an OS/PWA notification via the registered Service Worker (best Android PWA behavior)
 * with deduplication per `dedupKey`.
 */
export async function showRideSystemNotification(params: {
  ride: RideBooking;
  portal: 'driver' | 'admin' | 'customer';
  title: string;
  body: string;
  dedupKey: string;
}): Promise<boolean> {
  if (notifiedDedupSet.has(params.dedupKey)) return false;
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  notifiedDedupSet.add(params.dedupKey);
  if (notifiedDedupSet.size > 400) {
    const first = notifiedDedupSet.values().next().value;
    if (first) notifiedDedupSet.delete(first);
  }

  const targetUrl = buildRideDeepLinkUrl({
    portal: params.portal,
    rideId: params.ride.id
  });

  const options: NotificationOptions & {
    renotify?: boolean;
    vibrate?: number[];
    channelId?: string;
  } = {
    body: params.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: `torsha-ride-${params.ride.id}`,
    renotify: true,
    requireInteraction: true,
    vibrate: [240, 120, 240, 120, 320],
    data: {
      rideId: params.ride.id,
      portal: params.portal,
      url: targetUrl,
      channelId: RIDE_NOTIFICATION_CHANNEL_ID
    }
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(params.title, options);
        return true;
      }
    }
    const n = new Notification(params.title, options);
    n.onclick = () => {
      try {
        window.focus();
        window.dispatchEvent(
          new CustomEvent('torsha-ride-navigate', {
            detail: { portal: params.portal, rideId: params.ride.id }
          })
        );
      } catch {}
      n.close();
    };
    return true;
  } catch (err) {
    console.warn('Show system notification notice:', (err as Error)?.message);
    return false;
  }
}

export async function closeRideSystemNotification(rideId: string) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg || typeof reg.getNotifications !== 'function') return;
    const notifications = await reg.getNotifications({ tag: `torsha-ride-${rideId}` });
    notifications.forEach((n) => n.close());
  } catch {}
}

export async function recordRideNotificationLog(entry: Omit<RideNotificationLog, 'id'>) {
  const safeDedup = entry.dedupKey.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  const id = `rnl-${safeDedup}`;
  const full: RideNotificationLog = { id, ...entry };
  await safeSetDoc(doc(db, 'rideNotificationLogs', id), full, { merge: true }).catch(() => {});
}
