import { getAdminDb } from './src/lib/firebase-admin';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

try {
  const db = getAdminDb();
  console.log('Success!', !!db);
} catch (err) {
  console.error('Firebase admin error:', err);
}
