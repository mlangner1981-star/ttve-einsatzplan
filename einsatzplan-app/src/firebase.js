import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
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

// experimentalAutoDetectLongPolling: erkennt automatisch, wenn eine normale
// Streaming-Verbindung blockiert wird (Firmen-Netzwerke, manche Antivirus-/
// Sicherheitssoftware, bestimmte Router) und wechselt dann selbstständig auf
// eine kompatiblere Verbindungsart. Behebt "Speichert…" hängt dauerhaft.
export const db = configIsMissing
  ? null
  : initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });

export const auth = configIsMissing ? null : getAuth(app);