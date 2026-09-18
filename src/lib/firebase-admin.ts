import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let _adminDb: ReturnType<typeof getFirestore> | null = null;

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, ''),
    }),
  });
}

export function getAdminDb() {
  if (!_adminDb) {
    _adminDb = getFirestore(getAdminApp());
  }
  return _adminDb;
}

// Backwards-compatible proxy so existing imports of adminDb still work
export const adminDb = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_target, prop) {
    const db = getAdminDb();
    const val = (db as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? val.bind(db) : val;
  },
});
