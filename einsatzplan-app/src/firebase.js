import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Diese Werte trägst du nach dem Anlegen deines Firebase-Projekts
// als Umgebungsvariablen bei Vercel ein (siehe README.md).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const configIsMissing = !firebaseConfig.apiKey || !firebaseConfig.projectId;

const app = configIsMissing ? null : initializeApp(firebaseConfig);
export const db = configIsMissing ? null : getFirestore(app);
export const auth = configIsMissing ? null : getAuth(app);
