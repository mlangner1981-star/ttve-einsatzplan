import { initializeApp } from "firebase/app";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";
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

// - memoryLocalCache: schaltet die lokale IndexedDB-Zwischenspeicherung aus.
//   Diese sorgt bei mehreren gleichzeitig offenen Tabs/Fenstern (z. B. beim
//   Testen in normalem + privatem Fenster gleichzeitig) dafür, dass sich die
//   Tabs gegenseitig blockieren ("Speichert…" hängt dann in den anderen
//   Tabs dauerhaft). Für dieses Live-Team-Tool brauchen wir keine
//   Offline-Zwischenspeicherung, daher schalten wir sie komplett ab.
// - experimentalForceLongPolling: erzwingt die kompatible Verbindungsart für
//   restriktive Netzwerke/Firewalls.
export const db = configIsMissing
  ? null
  : initializeFirestore(app, {
      localCache: memoryLocalCache(),
      experimentalForceLongPolling: true,
    });

export const auth = configIsMissing ? null : getAuth(app);
