import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoDummyApiKeyForLocalDevelopment123',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:1234567890'
};

export const isFirebaseConfigured = () => {
  const key = import.meta.env.VITE_FIREBASE_API_KEY;
  const project = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  return Boolean(
    key &&
    key !== 'your_firebase_api_key' &&
    project &&
    project !== 'your_firebase_project_id'
  );
};

// Log active Firebase Project ID for transparency
if (typeof window !== 'undefined') {
  console.log('🔥 Active Firebase Project ID:', firebaseConfig.projectId);
}

// Safe Initialize Firebase
let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (err) {
  console.warn('Firebase initialization fallback triggered:', err);
  app = getApps()[0] || initializeApp({
    apiKey: 'AIzaSyDemoDummyApiKeyForLocalDevelopment123',
    projectId: 'demo-project'
  });
}

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
