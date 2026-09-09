// src/firebaseConfig.ts

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Use environment variables from Vercel or local .env files.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Fail fast with a clear message if env vars are missing (common cause of
// "auth/invalid-api-key" / "auth/configuration-not-found" at login time).
const requiredKeys = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
] as const;
const missingKeys = requiredKeys.filter(
  (k) => !import.meta.env[k]
);
if (missingKeys.length > 0) {
  console.error(
    `[firebaseConfig] Missing Firebase env vars: ${missingKeys.join(", ")}. ` +
      `Check app/.env / Vercel Environment Variables. Google sign-in will fail until these are set.`
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.useDeviceLanguage();

const provider = new GoogleAuthProvider();
// Always show the account chooser so users stuck on the wrong account can switch.
provider.setCustomParameters({ prompt: "select_account" });

const db = getFirestore(app);

// getAnalytics throws when measurementId is missing or in non-browser
// environments — never let analytics break auth/firestore.
let analytics: ReturnType<typeof getAnalytics> | null = null;
try {
  if (typeof window !== "undefined" && firebaseConfig.measurementId) {
    analytics = getAnalytics(app);
  }
} catch (e) {
  console.warn("[firebaseConfig] Analytics init skipped:", e);
}

export { auth, provider, db, analytics };
