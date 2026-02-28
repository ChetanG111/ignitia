import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
    initializeAuth,
    getAuth,
    browserLocalPersistence,
    browserSessionPersistence,
    indexedDBLocalPersistence,
    type Auth,
} from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Use initializeAuth with explicit persistence to avoid
// "Pending promise was never set" error in Next.js with Turbopack.
// getAuth() auto-detects persistence (including IndexedDB probing) which
// can race with SSR / hot-reloads. Explicit persistence avoids this.
let auth: Auth;
if (getApps().length > 1) {
    // Already initialized — just retrieve the existing instance
    auth = getAuth(app);
} else {
    try {
        auth = initializeAuth(app, {
            persistence: [
                indexedDBLocalPersistence,
                browserLocalPersistence,
                browserSessionPersistence,
            ],
        });
    } catch {
        // initializeAuth throws if called twice on the same app — fallback
        auth = getAuth(app);
    }
}

const storage = getStorage(app);

export { app, db, auth, storage };
